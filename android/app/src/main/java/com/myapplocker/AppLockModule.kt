package com.myapplocker

import android.content.Intent
import android.content.pm.ApplicationInfo
import android.content.pm.PackageManager
import android.graphics.Bitmap
import android.graphics.Canvas
import android.graphics.drawable.BitmapDrawable
import android.graphics.drawable.Drawable
import android.net.Uri
import android.os.Build
import android.provider.Settings
import android.security.keystore.KeyGenParameterSpec
import android.util.Base64
import androidx.biometric.BiometricManager
import com.facebook.react.bridge.*
import com.facebook.react.modules.core.DeviceEventManagerModule
import kotlinx.coroutines.*
import java.security.MessageDigest
import java.security.SecureRandom

/**
 * Native Module bridging Android system APIs to React Native.
 *
 * Exposed methods:
 *   - Permission checks and requests
 *   - Service start/stop
 *   - Installed app list retrieval
 *   - Locked app CRUD
 *   - PIN management (hash + verify)
 *   - Biometric availability
 *   - Unlock notification (from LockOverlayActivity)
 */
class AppLockModule(private val reactContext: ReactApplicationContext) :
    ReactContextBaseJavaModule(reactContext) {

    companion object {
        const val MODULE_NAME = "AppLockModule"
        const val EVENT_APP_LOCKED = "APP_LOCKED"
        const val EVENT_UNLOCK_SUCCESS = "UNLOCK_SUCCESS"
    }

    private val moduleScope = CoroutineScope(Dispatchers.IO + SupervisorJob())
    private val db by lazy { AppDatabase.getInstance(reactContext) }

    override fun getName(): String = MODULE_NAME

    // ─── Permissions ──────────────────────────────────────────────────────────

    @ReactMethod
    fun checkUsagePermission(promise: Promise) {
        promise.resolve(UsageStatsHelper.hasUsagePermission(reactContext))
    }

    @ReactMethod
    fun requestUsagePermission(promise: Promise) {
        try {
            UsageStatsHelper.openUsageAccessSettings(reactContext)
            promise.resolve(true)
        } catch (e: Exception) {
            promise.reject("ERROR", e.message)
        }
    }

    @ReactMethod
    fun checkOverlayPermission(promise: Promise) {
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.M) {
            promise.resolve(Settings.canDrawOverlays(reactContext))
        } else {
            promise.resolve(true)
        }
    }

    @ReactMethod
    fun requestOverlayPermission(promise: Promise) {
        try {
            val intent = Intent(
                Settings.ACTION_MANAGE_OVERLAY_PERMISSION,
                Uri.parse("package:${reactContext.packageName}")
            ).apply { addFlags(Intent.FLAG_ACTIVITY_NEW_TASK) }
            reactContext.startActivity(intent)
            promise.resolve(true)
        } catch (e: Exception) {
            promise.reject("ERROR", e.message)
        }
    }

    // ─── Service Control ──────────────────────────────────────────────────────

    @ReactMethod
    fun startMonitorService(promise: Promise) {
        try {
            val intent = Intent(reactContext, AppMonitorService::class.java).apply {
                action = AppMonitorService.ACTION_START
            }
            if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
                reactContext.startForegroundService(intent)
            } else {
                reactContext.startService(intent)
            }
            moduleScope.launch {
                val settings = db.settingsDao().getSettings() ?: AppSettings()
                db.settingsDao().saveSettings(settings.copy(serviceEnabled = true))
            }
            promise.resolve(true)
        } catch (e: Exception) {
            promise.reject("ERROR", e.message)
        }
    }

    @ReactMethod
    fun stopMonitorService(promise: Promise) {
        try {
            val intent = Intent(reactContext, AppMonitorService::class.java).apply {
                action = AppMonitorService.ACTION_STOP
            }
            reactContext.startService(intent)
            moduleScope.launch {
                val settings = db.settingsDao().getSettings() ?: AppSettings()
                db.settingsDao().saveSettings(settings.copy(serviceEnabled = false))
            }
            promise.resolve(true)
        } catch (e: Exception) {
            promise.reject("ERROR", e.message)
        }
    }

    // ─── Installed Apps ───────────────────────────────────────────────────────

    @ReactMethod
    fun getInstalledApps(promise: Promise) {
        moduleScope.launch {
            try {
                val pm = reactContext.packageManager
                val flags = if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.TIRAMISU) {
                    PackageManager.GET_META_DATA.toLong()
                } else {
                    PackageManager.GET_META_DATA.toLong()
                }

                val packages = pm.getInstalledApplications(PackageManager.GET_META_DATA)
                val lockedSet = db.lockedAppDao().getAllApps()
                    .filter { it.isEnabled }
                    .map { it.packageName }
                    .toSet()

                val result = WritableNativeArray()
                packages
                    .filter { it.flags and ApplicationInfo.FLAG_SYSTEM == 0 }
                    .sortedBy { pm.getApplicationLabel(it).toString() }
                    .forEach { appInfo ->
                        val map = WritableNativeMap().apply {
                            putString("packageName", appInfo.packageName)
                            putString("appName", pm.getApplicationLabel(appInfo).toString())
                            putBoolean("isLocked", appInfo.packageName in lockedSet)
                            // Encode icon as base64 for JS side
                            try {
                                val icon = pm.getApplicationIcon(appInfo.packageName)
                                putString("icon", drawableToBase64(icon))
                            } catch (_: Exception) {
                                putString("icon", "")
                            }
                        }
                        result.pushMap(map)
                    }

                withContext(Dispatchers.Main) { promise.resolve(result) }
            } catch (e: Exception) {
                withContext(Dispatchers.Main) { promise.reject("ERROR", e.message) }
            }
        }
    }

    // ─── Locked Apps CRUD ─────────────────────────────────────────────────────

    @ReactMethod
    fun getLockedApps(promise: Promise) {
        moduleScope.launch {
            try {
                val apps = db.lockedAppDao().getAllApps()
                val result = WritableNativeArray()
                apps.forEach { app ->
                    val map = WritableNativeMap().apply {
                        putString("packageName", app.packageName)
                        putString("appName", app.appName)
                        putBoolean("isEnabled", app.isEnabled)
                        putDouble("addedAt", app.addedAt.toDouble())
                    }
                    result.pushMap(map)
                }
                withContext(Dispatchers.Main) { promise.resolve(result) }
            } catch (e: Exception) {
                withContext(Dispatchers.Main) { promise.reject("ERROR", e.message) }
            }
        }
    }

    @ReactMethod
    fun setAppLocked(packageName: String, appName: String, isLocked: Boolean, promise: Promise) {
        moduleScope.launch {
            try {
                if (isLocked) {
                    db.lockedAppDao().insertOrUpdate(
                        LockedApp(packageName = packageName, appName = appName, isEnabled = true)
                    )
                } else {
                    db.lockedAppDao().deleteByPackage(packageName)
                }
                withContext(Dispatchers.Main) { promise.resolve(true) }
            } catch (e: Exception) {
                withContext(Dispatchers.Main) { promise.reject("ERROR", e.message) }
            }
        }
    }

    // ─── PIN Management ───────────────────────────────────────────────────────

    @ReactMethod
    fun setPIN(pin: String, promise: Promise) {
        moduleScope.launch {
            try {
                val salt = generateSalt()
                val hash = hashPIN(pin, salt)
                val settings = db.settingsDao().getSettings() ?: AppSettings()
                db.settingsDao().saveSettings(
                    settings.copy(pinHash = hash, pinSalt = salt, failedAttempts = 0, lockoutUntil = 0L)
                )
                withContext(Dispatchers.Main) { promise.resolve(true) }
            } catch (e: Exception) {
                withContext(Dispatchers.Main) { promise.reject("ERROR", e.message) }
            }
        }
    }

    @ReactMethod
    fun verifyPIN(pin: String, promise: Promise) {
        moduleScope.launch {
            try {
                val settings = db.settingsDao().getSettings()
                if (settings == null || settings.pinHash.isEmpty()) {
                    withContext(Dispatchers.Main) { promise.resolve(false) }
                    return@launch
                }

                // Check lockout
                val now = System.currentTimeMillis()
                if (settings.lockoutUntil > now) {
                    val remaining = ((settings.lockoutUntil - now) / 1000).toInt()
                    withContext(Dispatchers.Main) {
                        promise.reject("LOCKED_OUT", "Try again in $remaining seconds")
                    }
                    return@launch
                }

                val correct = hashPIN(pin, settings.pinSalt) == settings.pinHash
                if (correct) {
                    db.settingsDao().updateFailedAttempts(0, 0L)
                } else {
                    val newCount = settings.failedAttempts + 1
                    val lockout = if (newCount >= 5) now + 30_000L else 0L  // 30s lockout after 5 failures
                    db.settingsDao().updateFailedAttempts(newCount, lockout)
                }
                withContext(Dispatchers.Main) { promise.resolve(correct) }
            } catch (e: Exception) {
                withContext(Dispatchers.Main) { promise.reject("ERROR", e.message) }
            }
        }
    }

    @ReactMethod
    fun hasPIN(promise: Promise) {
        moduleScope.launch {
            val settings = db.settingsDao().getSettings()
            withContext(Dispatchers.Main) {
                promise.resolve(settings != null && settings.pinHash.isNotEmpty())
            }
        }
    }

    // ─── Settings ─────────────────────────────────────────────────────────────

    @ReactMethod
    fun getSettings(promise: Promise) {
        moduleScope.launch {
            try {
                val settings = db.settingsDao().getSettings() ?: AppSettings()
                val map = WritableNativeMap().apply {
                    putString("unlockMethod", settings.unlockMethod)
                    putDouble("gracePeriodMs", settings.gracePeriodMs.toDouble())
                    putString("themeId", settings.themeId)
                    putBoolean("intruderSelfie", settings.intruderSelfie)
                    putBoolean("serviceEnabled", settings.serviceEnabled)
                    putInt("failedAttempts", settings.failedAttempts)
                    putDouble("lockoutUntil", settings.lockoutUntil.toDouble())
                }
                withContext(Dispatchers.Main) { promise.resolve(map) }
            } catch (e: Exception) {
                withContext(Dispatchers.Main) { promise.reject("ERROR", e.message) }
            }
        }
    }

    @ReactMethod
    fun saveSettings(settingsMap: ReadableMap, promise: Promise) {
        moduleScope.launch {
            try {
                val existing = db.settingsDao().getSettings() ?: AppSettings()
                val updated = existing.copy(
                    unlockMethod = settingsMap.getString("unlockMethod") ?: existing.unlockMethod,
                    gracePeriodMs = settingsMap.getDouble("gracePeriodMs").toLong(),
                    themeId = settingsMap.getString("themeId") ?: existing.themeId,
                    intruderSelfie = if (settingsMap.hasKey("intruderSelfie"))
                        settingsMap.getBoolean("intruderSelfie") else existing.intruderSelfie,
                )
                db.settingsDao().saveSettings(updated)
                withContext(Dispatchers.Main) { promise.resolve(true) }
            } catch (e: Exception) {
                withContext(Dispatchers.Main) { promise.reject("ERROR", e.message) }
            }
        }
    }

    // ─── Biometric ────────────────────────────────────────────────────────────

    @ReactMethod
    fun checkBiometric(promise: Promise) {
        val biometricManager = BiometricManager.from(reactContext)
        val result = when (biometricManager.canAuthenticate(
            BiometricManager.Authenticators.BIOMETRIC_STRONG or
                    BiometricManager.Authenticators.BIOMETRIC_WEAK
        )) {
            BiometricManager.BIOMETRIC_SUCCESS -> "AVAILABLE"
            BiometricManager.BIOMETRIC_ERROR_NO_HARDWARE -> "NO_HARDWARE"
            BiometricManager.BIOMETRIC_ERROR_HW_UNAVAILABLE -> "UNAVAILABLE"
            BiometricManager.BIOMETRIC_ERROR_NONE_ENROLLED -> "NOT_ENROLLED"
            else -> "UNKNOWN"
        }
        promise.resolve(result)
    }

    // ─── Unlock Notification ──────────────────────────────────────────────────

    /** Called from LockScreen component to dismiss the overlay */
    @ReactMethod
    fun notifyUnlockSuccess(promise: Promise) {
        LockOverlayActivity.activeInstance?.onUnlockSuccess()
        promise.resolve(true)
    }

    // ─── Event Emitter ────────────────────────────────────────────────────────

    fun sendEvent(eventName: String, params: WritableMap?) {
        reactContext
            .getJSModule(DeviceEventManagerModule.RCTDeviceEventEmitter::class.java)
            .emit(eventName, params)
    }

    @ReactMethod
    fun addListener(eventName: String) { /* Required for RN event emitter */ }

    @ReactMethod
    fun removeListeners(count: Int) { /* Required for RN event emitter */ }

    // ─── Helpers ──────────────────────────────────────────────────────────────

    private fun generateSalt(): String {
        val bytes = ByteArray(16)
        SecureRandom().nextBytes(bytes)
        return Base64.encodeToString(bytes, Base64.NO_WRAP)
    }

    private fun hashPIN(pin: String, salt: String): String {
        val input = "$salt:$pin"
        val digest = MessageDigest.getInstance("SHA-256")
        val hashBytes = digest.digest(input.toByteArray(Charsets.UTF_8))
        return Base64.encodeToString(hashBytes, Base64.NO_WRAP)
    }

    private fun drawableToBase64(drawable: Drawable): String {
        val bitmap = if (drawable is BitmapDrawable) {
            drawable.bitmap
        } else {
            val bmp = Bitmap.createBitmap(
                drawable.intrinsicWidth.coerceAtLeast(1),
                drawable.intrinsicHeight.coerceAtLeast(1),
                Bitmap.Config.ARGB_8888
            )
            val canvas = Canvas(bmp)
            drawable.setBounds(0, 0, canvas.width, canvas.height)
            drawable.draw(canvas)
            bmp
        }
        val scaled = Bitmap.createScaledBitmap(bitmap, 72, 72, true)
        val stream = java.io.ByteArrayOutputStream()
        scaled.compress(Bitmap.CompressFormat.PNG, 80, stream)
        return Base64.encodeToString(stream.toByteArray(), Base64.NO_WRAP)
    }
}
