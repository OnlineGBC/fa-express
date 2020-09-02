$scheduledJobsModal = $("#scheduledJobsModal");
$("#scheduled-jobs").on("click", () => {
    $('.listing').show();
    $('.hidden_fields_r').hide();
    return $.ajax({
        url: "/api/jobs",
        type: "GET",
        success: (data) => {
            output = '';
            data.forEach((job, i) => {
                var id = job.id;
                i++;
                var title = job.title;
                output += `<div class="job-item" data-id="${id}" onclick="showFields_r(${id})">${i}. ${title}</div>`;
            });
            $('.jobsList').html(output);
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
    
    $.alert({
        type: "info",
        title: "Please wait",
        content: "Job has been rescheduled"
    });

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
            console.log(data);
            logsTable.ajax.reload();
        }
    });
});

function cancelJob(){
    var id = $("#job_id").val();

    $.alert({
        type: "info",
        title: "Please wait",
        content: "Job has been cancelled"
    });

    $.ajax({
        url: "/api/cancelJob",
        type: "POST",
        data: JSON.stringify({
            id
        }),
        dataType: "json",
        contentType: "application/json",
        success: (data) => {
            console.log(data);
            logsTable.ajax.reload();
        }
    });

    return false;
}