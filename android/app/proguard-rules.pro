# Add project specific ProGuard rules here.

# ─── AppLocker Native Module ───────────────────────────────────────────────────
-keep class com.myapplocker.AppLockModule { *; }
-keep class com.myapplocker.AppLockPackage { *; }
-keep class com.myapplocker.AppMonitorService { *; }
-keep class com.myapplocker.LockOverlayActivity { *; }
-keep class com.myapplocker.BootReceiver { *; }

# ─── Room Database ─────────────────────────────────────────────────────────────
-keep class com.myapplocker.AppDatabase { *; }
-keep class com.myapplocker.LockedApp { *; }
-keep class com.myapplocker.AppSettings { *; }
-keep @androidx.room.Entity class * { *; }
-keep @androidx.room.Dao class * { *; }
-dontwarn androidx.room.**

# ─── React Native ─────────────────────────────────────────────────────────────
-keep class com.facebook.react.** { *; }
-dontwarn com.facebook.react.**

# ─── Kotlin Coroutines ────────────────────────────────────────────────────────
-keep class kotlinx.coroutines.** { *; }
-dontwarn kotlinx.coroutines.**

# ─── Biometric ────────────────────────────────────────────────────────────────
-keep class androidx.biometric.** { *; }

