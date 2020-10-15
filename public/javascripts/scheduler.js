$scheduledJobsModal = $("#scheduledJobsModal");
$("#scheduled-jobs").on("click", () => {
    $('.listing').show();
    $('.hidden_fields_r').hide();
    return $.ajax({
        url: "/api/jobs",
        type: "GET",
        success: (data) => {
            tableContent = '';
            jobs = [];
            console.log(data);
            $('.jobsList').html('');
            for (var i = 0; i < data.length; i++) {
                k = i + 1;
                jobs[i] = [];
                job = Object.assign({}, data[i]);
                jobs[i].id = job.id;
                jobs[i].title = job.title;
                jobs[i].logs = [];
                jobs[i].logs.push(job.Log);
                for (var j = i + 1; j < data.length; j++) {
                    job2 = Object.assign({}, data[j]);
                    if (job2.id == job.id) {
                        jobs[i].logs.push(job2.Log);
                        k = j;
                    }
                }
                i = k;
            }
            console.log(jobs);
            jobs.forEach((job, i) => {

                var id = job.id;
                i++;
                var title = job.title;
                var logs = job.logs;
                tableContent += `<div class="job-item" data-id="${id}" onclick="showFields_r(${id})"><p>Job Ref#: ` + title + '</p>';
                tableContent += '<table class="jobsTable table-custom"><thead>';
                tableContent += '<th>ScriptName</th><th>HostName</th><th>Scheduled Date/Time</th>';
                tableContent += '</thead>';
                tableContent += '<tbody>';
                logs.forEach(function (item) {
                    tableContent += '<tr>';
                    tableContent += '<td>' + item['ScriptName'] + '</td>';
                    tableContent += '<td>' + item['HostName'] + '</td>';
                    if (item['DateScheduled'] == null) {
                        tableContent += '<td>Periodic</td>';
                    }
                    else {
                        tableContent += '<td>' + item['DateScheduled'] + ' ' + item['TimeScheduled'] + '</td>';
                    }
                    tableContent += '</tr>';
                })
                tableContent += '</tbody></table></div>';

            });
            $('.jobsList').html(tableContent);
            $scheduledJobsModal.modal("show");

        }
    });
});
$reschedulerForm = $("#rescheduler-form");
$reschedulerForm.submit(e => {
    e.preventDefault();

    const id = $("#job_id").val();

    const dateValue = $("#r_date").val();

    const isValidDate = !!Date.parse(dateValue);
    const isValidTime = $("#r_time")[0].inputmask.isValid();

    const timezoneHours = $("#r_zone").val() || "";
    const selectedTimezoneText = $("#r_zone option:selected").text();
    const timezone = timezoneHours
        ? timeZones.find(({ text }) => text === selectedTimezoneText).timezone
        : "";

    let scheduleAt;
    scheduleAt = new Date(
        `${dateValue} ${$("#r_time").val()} ${$(
            "#r_format"
        ).val()} GMT${timezoneHours}`
    ).getTime();

    $scheduledJobsModal.modal('hide');
    if (scheduleAt < Date.now()) {
        $reschedulerForm
            .find(".error-message")
            .text("Please select a valid date, time and time zone in the future");
        return;
    }

    return $.ajax({
        url: "/api/reschedule",
        type: "POST",
        data: JSON.stringify({
            id,
            scheduleAt,
            timezone
        }),
        dataType: "json",
        contentType: "application/json",
        success: (data) => {

            $.alert({
                type: "info",
                title: "Please wait",
                content: "Job has been rescheduled"
            });
            console.log(data);
            logsTable.ajax.reload();
        },
        error: (data) => {
            $.alert({
                type: "error",
                title: "Failed",
                content: "Rescheduling failed. The job may no longer exist"
            });
        }
    });
});

function cancelJob() {
    var id = $("#job_id").val();

    $.ajax({
        url: "/api/cancelJob",
        type: "POST",
        data: JSON.stringify({
            id
        }),
        dataType: "json",
        contentType: "application/json",
        success: (data) => {
            $.alert({
                type: "info",
                title: "Please wait",
                content: "Job has been cancelled."
            });
            console.log(data);
            logsTable.ajax.reload();
        },
        error: (error) => {
            $.alert({
                type: "error",
                title: "Failed",
                content: "There was an error cancelling the job or the job doesn't exists."
            });
        }
    });

    return false;
}

function showPeriodic(id) {
    $.ajax({
        url: "/api/periodic",
        type: "POST",
        data: JSON.stringify({
            id
        }),
        dataType: "json",
        contentType: "application/json",
        success: (data) => {
            $.alert({
                columnClass: 'col-md-6',
                type: "blue",
                title: "<h3>Job Schedule Details</h3>",
                content: "<h4>The job is scheduled to run:<br><br>" + data + "</h4>"
            });
            console.log(data);
        },
        error: (data) => {
            $.alert({
                type: "error",
                title: "Failed",
                content: "Failed to get details"
            });
        }
    })
}