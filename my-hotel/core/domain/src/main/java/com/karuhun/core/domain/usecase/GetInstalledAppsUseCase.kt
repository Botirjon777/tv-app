package com.karuhun.core.domain.usecase

import com.karuhun.core.domain.repository.ApplicationLauncher
import com.karuhun.core.model.Application
import javax.inject.Inject

// Lists apps installed on the device (system + user) that can be launched.
class GetInstalledAppsUseCase @Inject constructor(
    private val applicationLauncher: ApplicationLauncher,
) {
    operator fun invoke(): List<Application> = applicationLauncher.getLaunchableApplications()
}
