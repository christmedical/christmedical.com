package com.christmedical.app

import org.junit.Assert.assertEquals
import org.junit.Assert.assertFalse
import org.junit.Assert.assertTrue
import org.junit.Test

class AppConfigTest {

    @Test
    fun portalUrlIsProductionLogin() {
        assertEquals("https://login.christmedical.com/", AppConfig.PORTAL_URL)
    }

    @Test
    fun allowsLoginHostNavigation() {
        assertTrue(AppConfig.isAllowedNavigation("https://login.christmedical.com/auth"))
    }

    @Test
    fun allowsChristMedicalSubdomain() {
        assertTrue(AppConfig.isAllowedNavigation("https://app.christmedical.com/queue"))
    }

    @Test
    fun rejectsExternalHost() {
        assertFalse(AppConfig.isAllowedNavigation("https://evil.example.com/"))
    }

    @Test
    fun rejectsMailtoWithoutHostMatch() {
        assertFalse(AppConfig.isAllowedNavigation("mailto:support@christmedical.com"))
    }
}
