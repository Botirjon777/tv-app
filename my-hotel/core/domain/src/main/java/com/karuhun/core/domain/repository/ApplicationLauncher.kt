package com.karuhun.core.domain.repository

import com.karuhun.core.common.Resource
import com.karuhun.core.model.Application

interface ApplicationLauncher {
    fun launchApplication(packageName: String): Resource<Unit>

    // Apps installed on this device that have a launcher entry (TV + phone
    // launcher categories), excluding this launcher itself.
    fun getLaunchableApplications(): List<Application>
}