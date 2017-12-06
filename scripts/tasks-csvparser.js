/**
 * Created by jiaow on 10/09/2017.
 */
self.addEventListener('message', function (aMessage) {
    var data = aMessage.data;
    var lines = data.split('\n');
    var tasks = [];
//jquery cannot be used in WW
    for (var i = 0; i < lines.length; i++) {
        var val = lines[i];
        if (i >= 1 && val) {
            // console.log(val)
            var task = loadTask(val);
            if (task)
                tasks.push(task);
        }
    }

    self.postMessage(tasks);

}, false);


function loadTask(csvTask) {
    // var tokens = $.csv.toArray(csvTask);
    var tokens=csvTask.split(',');
    if (tokens.length === 4) {

        var task = {};
        task.task = tokens[0];
        task.requiredBy = tokens[1];
        task.category = tokens[2];
        task.complete = tokens[3];
        return task;
    }
    else
        return null;
}
