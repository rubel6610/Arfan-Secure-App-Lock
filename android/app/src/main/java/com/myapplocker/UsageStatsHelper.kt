package com.myapplocker

import android.app.usage.UsageEvents
import android.app.usage.UsageStatsManager
import android.content.Context
import android.content.Intent
import android.provider.Settings

/**
 * Helper class for detecting which app is currently in the foreground
 * using the UsageStatsManager API (requires PACKAGE_USAGE_STATS permission).
 */
object UsageStatsHelper {

    /**
     * Returns the package name of the app currently in the foreground,
     * or null if detection fails or permission is not granted.
     */
    fun getForegroundPackage(context: Context): String? {
        if (!hasUsagePermission(context)) return null

        val usm = context.getSystemService(Context.USAGE_STATS_SERVICE) as UsageStatsManager
        val endTime = System.currentTimeMillis()
        val startTime = endTime - 5_000L  // look back 5 seconds

        val events = usm.queryEvents(startTime, endTime)
        val event = UsageEvents.Event()

        var lastForegroundPackage: String? = null
        var lastEventTime = 0L

        while (events.hasNextEvent()) {
            events.getNextEvent(event)
            if (event.eventType == UsageEvents.Event.MOVE_TO_FOREGROUND
                && event.timeStamp > lastEventTime
            ) {
                lastEventTime = event.timeStamp
                lastForegroundPackage = event.packageName
            }
        }

        return lastForegroundPackage
    }

    /**
     * Checks whether the PACKAGE_USAGE_STATS permission has been granted.
     */
    fun hasUsagePermission(context: Context): Boolean {
        val usm = context.getSystemService(Context.USAGE_STATS_SERVICE) as UsageStatsManager
        val endTime = System.currentTimeMillis()
        val stats = usm.queryUsageStats(
            UsageStatsManager.INTERVAL_DAILY,
            endTime - 1000,
            endTime
        )
        return stats != null && stats.isNotEmpty()
    }

    /**
     * Opens the system Usage Access settings screen.
     */
    fun openUsageAccessSettings(context: Context) {
        val intent = Intent(Settings.ACTION_USAGE_ACCESS_SETTINGS)
        intent.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK)
        context.startActivity(intent)
    }
}
