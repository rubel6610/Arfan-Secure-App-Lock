package com.myapplocker

import android.app.Notification
import android.app.NotificationChannel
import android.app.NotificationManager
import android.app.PendingIntent
import android.app.Service
import android.content.Intent
import android.os.Build
import android.os.Handler
import android.os.IBinder
import android.os.Looper
import androidx.core.app.NotificationCompat
import kotlinx.coroutines.*

/**
 * Foreground service that continuously monitors which app is in the foreground.
 * When a locked app is detected, it launches LockOverlayActivity over it.
 */
class AppMonitorService : Service() {

    companion object {
        const val CHANNEL_ID = "applock_monitor_channel"
        const val NOTIFICATION_ID = 1001
        const val POLL_INTERVAL_MS = 500L

        const val ACTION_START = "ACTION_START_MONITOR"
        const val ACTION_STOP = "ACTION_STOP_MONITOR"
    }

    private val serviceScope = CoroutineScope(Dispatchers.IO + SupervisorJob())
    private val handler = Handler(Looper.getMainLooper())
    private lateinit var db: AppDatabase

    private var lastLockedPackage: String? = null
    private var lockedPackages: Set<String> = emptySet()

    // ─── Polling Runnable ──────────────────────────────────────────────────────

    private val pollRunnable = object : Runnable {
        override fun run() {
            checkForegroundApp()
            handler.postDelayed(this, POLL_INTERVAL_MS)
        }
    }

    // ─── Lifecycle ─────────────────────────────────────────────────────────────

    override fun onCreate() {
        super.onCreate()
        db = AppDatabase.getInstance(applicationContext)
        createNotificationChannel()
        startForeground(NOTIFICATION_ID, buildNotification())
        loadLockedPackages()
    }

    override fun onStartCommand(intent: Intent?, flags: Int, startId: Int): Int {
        when (intent?.action) {
            ACTION_STOP -> {
                stopSelf()
                return START_NOT_STICKY
            }
            else -> {
                // Start polling
                handler.post(pollRunnable)
                // Refresh locked packages every 3 seconds from DB
                serviceScope.launch {
                    while (isActive) {
                        loadLockedPackages()
                        delay(3000)
                    }
                }
            }
        }
        return START_STICKY
    }

    override fun onDestroy() {
        handler.removeCallbacks(pollRunnable)
        serviceScope.cancel()
        super.onDestroy()
    }

    override fun onBind(intent: Intent?): IBinder? = null

    // ─── Core Logic ───────────────────────────────────────────────────────────

    private fun checkForegroundApp() {
        val foregroundPkg = UsageStatsHelper.getForegroundPackage(applicationContext) ?: return

        // Ignore our own app
        if (foregroundPkg == packageName) {
            lastLockedPackage = null
            return
        }

        // Check if this package is in the locked set
        if (foregroundPkg in lockedPackages) {
            // Avoid re-triggering for same package consecutively
            if (lastLockedPackage == foregroundPkg) return

            lastLockedPackage = foregroundPkg
            launchLockScreen(foregroundPkg)
        } else {
            // Not a locked app — clear state
            if (lastLockedPackage != null && foregroundPkg != lastLockedPackage) {
                lastLockedPackage = null
            }
        }
    }

    private fun launchLockScreen(packageName: String) {
        val intent = Intent(applicationContext, LockOverlayActivity::class.java).apply {
            putExtra(LockOverlayActivity.EXTRA_PACKAGE_NAME, packageName)
            addFlags(Intent.FLAG_ACTIVITY_NEW_TASK)
            addFlags(Intent.FLAG_ACTIVITY_CLEAR_TOP)
            addFlags(Intent.FLAG_ACTIVITY_SINGLE_TOP)
        }
        applicationContext.startActivity(intent)
    }

    private fun loadLockedPackages() {
        serviceScope.launch {
            val apps = db.lockedAppDao().getAllApps()
            lockedPackages = apps.filter { it.isEnabled }.map { it.packageName }.toSet()
        }
    }

    // ─── Notification ─────────────────────────────────────────────────────────

    private fun createNotificationChannel() {
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
            val channel = NotificationChannel(
                CHANNEL_ID,
                "AppLocker Monitor",
                NotificationManager.IMPORTANCE_LOW
            ).apply {
                description = "AppLocker is actively protecting your apps"
                setShowBadge(false)
            }
            val nm = getSystemService(NOTIFICATION_SERVICE) as NotificationManager
            nm.createNotificationChannel(channel)
        }
    }

    private fun buildNotification(): Notification {
        val stopIntent = Intent(this, AppMonitorService::class.java).apply {
            action = ACTION_STOP
        }
        val stopPendingIntent = PendingIntent.getService(
            this, 0, stopIntent,
            PendingIntent.FLAG_UPDATE_CURRENT or PendingIntent.FLAG_IMMUTABLE
        )

        val openIntent = Intent(this, MainActivity::class.java)
        val openPendingIntent = PendingIntent.getActivity(
            this, 0, openIntent,
            PendingIntent.FLAG_UPDATE_CURRENT or PendingIntent.FLAG_IMMUTABLE
        )

        return NotificationCompat.Builder(this, CHANNEL_ID)
            .setContentTitle("AppLocker is active")
            .setContentText("Protecting your apps")
            .setSmallIcon(android.R.drawable.ic_lock_lock)
            .setOngoing(true)
            .setContentIntent(openPendingIntent)
            .addAction(android.R.drawable.ic_delete, "Stop", stopPendingIntent)
            .setPriority(NotificationCompat.PRIORITY_LOW)
            .build()
    }
}
