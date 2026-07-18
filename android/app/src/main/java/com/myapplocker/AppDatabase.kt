package com.myapplocker

import android.content.Context
import androidx.room.*
import kotlinx.coroutines.flow.Flow

// ─── Entities ─────────────────────────────────────────────────────────────────

@Entity(tableName = "locked_apps")
data class LockedApp(
    @PrimaryKey val packageName: String,
    val appName: String,
    val isEnabled: Boolean = true,
    val addedAt: Long = System.currentTimeMillis()
)

@Entity(tableName = "app_settings")
data class AppSettings(
    @PrimaryKey val id: Int = 1,
    val pinHash: String = "",
    val pinSalt: String = "",
    val unlockMethod: String = "PIN",   // PIN | PATTERN | BIOMETRIC
    val gracePeriodMs: Long = 0L,       // 0 = always lock, else ms of grace after unlock
    val themeId: String = "DARK",
    val intruderSelfie: Boolean = false,
    val serviceEnabled: Boolean = false,
    val failedAttempts: Int = 0,
    val lockoutUntil: Long = 0L
)

// ─── DAOs ─────────────────────────────────────────────────────────────────────

@Dao
interface LockedAppDao {
    @Query("SELECT * FROM locked_apps WHERE isEnabled = 1")
    fun observeLockedApps(): Flow<List<LockedApp>>

    @Query("SELECT * FROM locked_apps")
    suspend fun getAllApps(): List<LockedApp>

    @Query("SELECT * FROM locked_apps WHERE packageName = :pkg LIMIT 1")
    suspend fun getApp(pkg: String): LockedApp?

    @Query("SELECT COUNT(*) > 0 FROM locked_apps WHERE packageName = :pkg AND isEnabled = 1")
    suspend fun isLocked(pkg: String): Boolean

    @Insert(onConflict = OnConflictStrategy.REPLACE)
    suspend fun insertOrUpdate(app: LockedApp)

    @Delete
    suspend fun delete(app: LockedApp)

    @Query("DELETE FROM locked_apps WHERE packageName = :pkg")
    suspend fun deleteByPackage(pkg: String)

    @Query("UPDATE locked_apps SET isEnabled = :enabled WHERE packageName = :pkg")
    suspend fun setEnabled(pkg: String, enabled: Boolean)
}

@Dao
interface AppSettingsDao {
    @Query("SELECT * FROM app_settings WHERE id = 1")
    suspend fun getSettings(): AppSettings?

    @Insert(onConflict = OnConflictStrategy.REPLACE)
    suspend fun saveSettings(settings: AppSettings)

    @Query("UPDATE app_settings SET failedAttempts = :count, lockoutUntil = :lockoutUntil WHERE id = 1")
    suspend fun updateFailedAttempts(count: Int, lockoutUntil: Long)

    @Query("UPDATE app_settings SET serviceEnabled = :enabled WHERE id = 1")
    suspend fun setServiceEnabled(enabled: Boolean)
}

// ─── Database ─────────────────────────────────────────────────────────────────

@Database(
    entities = [LockedApp::class, AppSettings::class],
    version = 1,
    exportSchema = false
)
abstract class AppDatabase : RoomDatabase() {
    abstract fun lockedAppDao(): LockedAppDao
    abstract fun settingsDao(): AppSettingsDao

    companion object {
        @Volatile private var instance: AppDatabase? = null

        fun getInstance(context: Context): AppDatabase =
            instance ?: synchronized(this) {
                instance ?: Room.databaseBuilder(
                    context.applicationContext,
                    AppDatabase::class.java,
                    "applock_db"
                ).build().also { instance = it }
            }
    }
}
