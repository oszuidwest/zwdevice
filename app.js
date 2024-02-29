const express = require('express')
const osUtils = require('os-utils')
const diskusage = require('diskusage')
const os = require('os')
const app = express()
const port = 3000

// Helper function to get disk usage information
const getDiskUsage = async () => {
  try {
    const path = os.platform() === 'win32' ? 'c:' : '/'
    const usage = await diskusage.check(path)
    return usage
  } catch (err) {
    console.error('Error getting disk usage: ', err)
    // Returning fallback values to prevent the application from crashing
    return { total: 0, free: 0, used: 0 }
  }
}

app.get('/', async (req, res) => {
  const cpuUsagePromise = new Promise((resolve) => osUtils.cpuUsage(resolve))
  const cpuUsage = await cpuUsagePromise
  const freeMemPercentage = osUtils.freememPercentage()
  const totalMem = osUtils.totalmem()
  const uptimeSeconds = osUtils.sysUptime()
  const days = Math.floor(uptimeSeconds / (3600 * 24))
  const hours = Math.floor((uptimeSeconds % (3600 * 24)) / 3600)
  const minutes = Math.floor((uptimeSeconds % 3600) / 60)
  const formattedUptime = `${days} days, ${hours} hours, ${minutes} minutes`
  const diskUsage = await getDiskUsage()
  const usedDiskSpace = diskUsage.total - diskUsage.free
  const diskUsagePercentage = ((usedDiskSpace / diskUsage.total) * 100).toFixed(2)
  const hostname = os.hostname()
  const cpus = os.cpus()
  const networkInterfaces = os.networkInterfaces()

  const cpuDetailsHtml = cpus.map((cpu, index) => `
        <div class="col-sm-6 col-md-4 mb-3">
            <div class="card h-100">
                <div class="card-body">
                    <h5 class="card-title">CPU ${index + 1}</h5>
                    <p class="card-text">${cpu.model}<br>Speed: ${cpu.speed} MHz</p>
                </div>
            </div>
        </div>
    `).join('')

  const networkInfoHtml = Object.keys(networkInterfaces).map((iface) => {
    return networkInterfaces[iface].map((info) => `
            <tr>
                <td>${iface}</td>
                <td>${info.family}</td>
                <td>${info.address}</td>
                <td>${info.netmask}</td>
                <td>${info.mac}</td>
                <td>${info.internal ? 'Yes' : 'No'}</td>
            </tr>
        `).join('')
  }).join('')

  res.send(`
        <!DOCTYPE html>
        <html lang="en">
        <head>
            <meta charset="UTF-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <title>System Information - ${hostname}</title>
            <link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/bootstrap@4.6.2/dist/css/bootstrap.min.css" integrity="sha384-xOolHFLEh07PJGoPkLv1IbcEPTNtaed2xpHsD9ESMhqIYd0nLMwNLD69Npy4HI+N" crossorigin="anonymous">
        </head>
        <body>
            <div class="container">
                <h1 class="mt-5">System Information</h1>
                <h2 class="mt-3">Hostname: ${hostname}</h2>
                <div class="row mt-3">${cpuDetailsHtml}</div>
                <div class="mt-3">
                    <p><strong>CPU Usage:</strong> ${(cpuUsage * 100).toFixed(2)}%</p>
                    <div class="progress mb-2">
                        <div class="progress-bar" role="progressbar" style="width: ${cpuUsage * 100}%" aria-valuenow="${cpuUsage * 100}" aria-valuemin="0" aria-valuemax="100"></div>
                    </div>
                    <p><strong>Free Memory:</strong> ${(freeMemPercentage * 100).toFixed(2)}%</p>
                    <div class="progress mb-2">
                        <div class="progress-bar bg-success" role="progressbar" style="width: ${freeMemPercentage * 100}%" aria-valuenow="${freeMemPercentage * 100}" aria-valuemin="0" aria-valuemax="100"></div>
                    </div>
                    <p><strong>Total Memory:</strong> ${totalMem}MB</p>
                    <p><strong>System Uptime:</strong> ${formattedUptime}</p>
                    <p><strong>Disk Usage:</strong> ${diskUsagePercentage}% used</p>
                    <div class="progress mb-3">
                        <div class="progress-bar bg-warning" role="progressbar" style="width: ${diskUsagePercentage}%" aria-valuenow="${diskUsagePercentage}" aria-valuemin="0" aria-valuemax="100"></div>
                    </div>
                </div>
                <h2 class="mt-4">Network Interfaces</h2>
                <table class="table">
                    <thead>
                        <tr>
                            <th>Interface</th>
                            <th>Family</th>
                            <th>Address</th>
                            <th>Netmask</th>
                            <th>MAC</th>
                            <th>Internal</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${networkInfoHtml}
                    </tbody>
                </table>
            </div>
        </body>
        </html>
    `)
})

app.listen(port, () => {
  console.log(`Server running at http://localhost:${port}`)
})
