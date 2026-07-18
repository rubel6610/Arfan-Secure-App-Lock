package com.myapplocker

import android.app.Activity
import android.content.Intent
import android.os.Build
import android.os.Bundle
import android.view.WindowManager
import com.facebook.react.ReactInstanceManager
import com.facebook.react.ReactRootView
import com.facebook.react.modules.core.DefaultHardwareBackBtnHandler

/**
 * Full-screen overlay Activity displayed when a locked app comes to the foreground.
 * Renders the React Native LockScreen component directly over the locked app.
 *
 * Flags ensure it shows even on the lock screen and prevents screenshots.
 */
class LockOverlayActivity : Activity(), DefaultHardwareBackBtnHandler {

    companion object {
        const val EXTRA_PACKAGE_NAME = "lockedPackageName"

        // Static reference to the active overlay so the bridge can dismiss it
        var activeInstance: LockOverlayActivity? = null
    }

    private var reactRootView: ReactRootView? = null
    private lateinit var lockedPackage: String

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)

        lockedPackage = intent.getStringExtra(EXTRA_PACKAGE_NAME) ?: run {
            finish()
            return
        }

        // Security: prevent screenshot of the lock screen
        window.addFlags(WindowManager.LayoutParams.FLAG_SECURE)

        // Show over lock screen
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O_MR1) {
            setShowWhenLocked(true)
            setTurnScreenOn(true)
        } else {
            @Suppress("DEPRECATION")
            window.addFlags(
                WindowManager.LayoutParams.FLAG_SHOW_WHEN_LOCKED or
                        WindowManager.LayoutParams.FLAG_TURN_SCREEN_ON
            )
        }

        activeInstance = this

        // Inflate React Native LockScreen component
        reactRootView = ReactRootView(this)
        val initialProps = Bundle().apply {
            putString("lockedPackage", lockedPackage)
        }

        val reactHost = (application as MainApplication).reactHost
        reactRootView?.startReactApplication(
            reactHost.reactInstanceManager,
            "LockScreen",   // Component registered in index.js
            initialProps
        )

        setContentView(reactRootView)
    }

    /** Called by the React Native LockScreen component on successful unlock */
    fun onUnlockSuccess() {
        activeInstance = null
        finish()
    }

    // ─── Back Button ──────────────────────────────────────────────────────────
    // Intercept back press so the user can't dismiss the lock screen with back

    override fun onBackPressed() {
        // Do nothing — lock screen cannot be dismissed by back button
    }

    override fun invokeDefaultOnBackPressed() {
        // No-op
    }

    // ─── Lifecycle ────────────────────────────────────────────────────────────

    override fun onDestroy() {
        activeInstance = null
        reactRootView?.unmountReactApplication()
        reactRootView = null
        super.onDestroy()
    }

    override fun onNewIntent(intent: Intent?) {
        super.onNewIntent(intent)
        setIntent(intent)
        // Update locked package if a new lock request comes in while overlay is open
        intent?.getStringExtra(EXTRA_PACKAGE_NAME)?.let {
            lockedPackage = it
        }
    }
}
