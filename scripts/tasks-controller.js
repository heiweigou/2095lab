tasksController = function(){
    //private (closure) data and methods
    var $taskPage;
    var initialised = false;
    var taskCount=0;

    function errorLogger(errorCode, errorMessage){
        console.log(errorCode + ': ' + errorMessage);
    }

    // function updateTaskCounter() {
    //     var count=$taskPage.find('#tblTasks tbody tr').length;
    //     $('footer').find('#taskCounter').text(count);
    // }

    function updateTaskCounter() {
        $('footer').find('#taskCounter').text(taskCount);
    }

    function clearTask() {
        $taskPage.find('form').fromObject({});

    }

    function bandTableRows() {
        $taskPage.find('#tblTasks tbody tr').removeClass('even');
        $taskPage.find('#tblTasks tbody tr:even').addClass('even');
        overDueAndWarning();
    }

    function ajaxTest1() {
        var aPromise=$.ajax({
            type:'GET',
            dataType:'json',
            url:'server/tasks.json',
            cache:false
        });

        aPromise.done(function (data) {
            console.log(data);
        });

        aPromise.fail(function (data) {
            console.log('json import failed');
        })
    }

    function ajaxTest2() {
        var cachedTasks=function () {
            var tasks=null;
            return{
                getTasks:function () {
                    var deferred=$.Deferred();
                    if(tasks)
                        deferred.resolve(tasks);
                    else {
                        var ajaxPromise=$.ajax({
                            url:'server/tasks.json'
                        });
                        ajaxPromise.done(function (data) {
                            tasks=data;
                            setTimeout(function () {
                                deferred.resolve(tasks)
                            },3000)
                        })
                    }
                    return deferred.promise();
                }
            }
        }();

        console.log('start: '+getTime());
        test(1);
        setTimeout(test,7000,2);
        console.log('end: '+getTime());

        function test(testNumber) {
            var promise;
            promise=cachedTasks.getTasks();
            promise.done(function (data) {
                console.log(testNumber+'success callback exectued'+getTime());
                console.log(data)
            })
        }
    }

    function getTime() {
        var now=new Date();
        return now.toLocaleTimeString()+":"+now.getMilliseconds();
    }

    // function loadFromCSV(event) {
    //     var reader=new FileReader();
    //     reader.onload=function (evt) {
    //
    //         var contents=evt.target.result;
    //         var lines=contents.split('\n');
    //         tasks=[];
    //         $.each(lines,function (i, val) {
    //             if (i>=1&&val){
    //                 console.log(val)
    //                 var task=loadTask(val);
    //                 if (task)
    //                     tasks.push(task)
    //             }
    //         });
    //         console.log(tasks);
    //         storageEngine.saveAll('task',tasks,function (){
    //             tasksController.loadTasks();
    //         },errorLogger)
    //
    //     };
    //
    //     reader.onerror=function (evt) {
    //         errorLogger('cannot read file','error reading specified file')
    //     };
    //     reader.readAsText(event.target.files[0])
    // }

    function loadFromCSV(event) {
        var reader=new FileReader();
        reader.onload=function (evt) {
            var fileContents=evt.target.result;
            var tasks=[];

            var worker=new Worker('scripts/tasks-csvparser.js');
            worker.addEventListener('message',function (result) {
                tasks=result.data;
                storageEngine.saveAll('task',tasks,function () {
                    tasksController.loadTasks();
                },errorLogger)
            },false)
            worker.postMessage(fileContents);
        }
        reader.onerror=function (evt) {
            errorLogger('cannot read file','error reading specified file');
        }
        reader.readAsText(event.target.files[0]);


    }

    function logPropertyValue(obj, property) {
        console.log(obj[property]);
    }

    function loadTask(csvTask) {
        var tokens=$.csv.toArray(csvTask);
        if(tokens.length===4){
            var task={};
            task.task=tokens[0];
            task.requiredBy=tokens[1];
            task.category=tokens[2];
            task.complete=tokens[3];
            return task;
        }
        else
            return null;
    }

    function overDueAndWarning() {
        $.each($taskPage.find('#tblTasks tbody tr'),function (index, row) {
            var $row=$(row);
            var dueDate=Date.parse($row.find('[datetime]').text());
            if(dueDate.compareTo(Date.today())<0){
                $row.removeClass('even');
                $row.addClass('overdue');
            }
            else if (dueDate.compareTo((2).days().fromNow())<=0){
                $row.removeClass('even');
                $row.addClass('warning');
            }
        })
    }

    return{
        init: function(page, callback) { //callback includes a call to loadTasks
            if (initialised)
                callback(); //only execute tasksController.loadTasks() if storageEngine initialisation is complete
            else{
                $taskPage = page; //it's a jQuery object so prefix variable with $ as a reminder

                storageEngine.init(function(){
                    storageEngine.initObjectStore('task', function(){callback();}, errorLogger); //call to loadTasks in callback passed to storageEngine
                }, errorLogger);

                $taskPage.find('[required="required"]').prev('label').append('<span>*</span>').children('span').addClass('required');
                $taskPage.find('tbody tr:even').addClass('even');

                $taskPage.find('#btnAddTask').click(function (evt) {
                    evt.preventDefault();
                    $taskPage.find('#taskCreation').removeClass('not');
                });

                //@@@ DELETE SELECTED
                $taskPage.find('#btnDeleteSelectedTasks').click(function (evt) {
                    var selectedTasks;
                    var numSelectedTasks;
                    var response;
                    var nbrDeleted = 0;
                    var idToDelete;

                    evt.preventDefault();
                    selectedTasks = $taskPage.find("#tblTasks tbody tr:has(.rowHighlight)");
                    numSelectedTasks = selectedTasks.length;

                    if (numSelectedTasks > 0) {
                        response = confirm("Delete " + numSelectedTasks + " selected tasks\n Are you sure?");
                        if (response) {
                            //do the data store delete for each selected task
                            //every .each iteration creates an asynchronous delete data store operation (presumably FIFO
                            // operations in the data store but no guarantees I guess)
                            //idToDelete is calculated before the asynchronous delete operation on each .each iteration and
                            // passed by value to delete as an actual parameter and assigned to an independent copy of delete's
                            // corresponding formal parameter, so no chance of being overwritten as a result of asynchronicity
                            //elem is more problematic as it is passed by reference not value, so is there a possibility of an
                            // asynchronous overwrite (so for instance only the last selected task gets deleted)?
                            //you would think .each creates an independent reference elem to each DOM node in the jQuery object
                            // it is iterating over which consists of an array like structure of DOM object references
                            //even if this was not the case elem is like a local variable to the anonymous function passed to
                            // the delete method so that function and elem should form an independent closure for each iteration
                            // i.e. one independent elem reference per call
                            //when a function is taken out of its lexical scope it takes a copy of that scope
                            selectedTasks.each(function(i, elem){
                                //when the anonymous callback gets passed into storageEngine.delete elem and idToDelete will be part of its closure
                                //so for every .each iteration there will be an independent closure = anonymous function + its own elem and idToDelete
                                idToDelete = parseInt($(elem).find('[data-task-id]').data().taskId); //IndexDB needs an integer not a String
                                storageEngine.delete('task', idToDelete,
                                    function(){
                                        nbrDeleted++; //so I know when its the last delete
                                        //$(elem).remove(); //a possible solution (elem will be an independent reference to an independent object either by .each or closure)

                                        //another solution: wait until after the last successful data store delete to update the UI
                                        if (nbrDeleted === numSelectedTasks){
                                            //this is the last success callback to execute so the last task has been deleted from the data store
                                            selectedTasks.remove();  //better
                                            //alert(numSelectedTasks + " tasks deleted!"); //this is never going to fly as it will hold up execution on the only thread so previous statement is blocked until user clicks OK
                                            tasksController.loadTasks();

                                            updateTaskCounter();
                                            bandTableRows();
                                        }
                                    },
                                    errorLogger);

                            });
                            //alert(numSelectedTasks + " tasks deleted!"); //this will almost certainly execute before all the asynchronous delete callbacks have executed
                        }
                        else
                            alert("Delete cancelled!");
                    }
                    else
                        alert("There are no tasks selected for deletion.");
                });

                $taskPage.find('tbody').on('click', 'td', 'time', function (evt) {
                    $(evt.target).closest('td').siblings().addBack().toggleClass('rowHighlight'); //$taskPage.find( NOT REQUIRED as evt already constrained by previous line
                });

                $taskPage.find('#tblTasks tbody').on('click', '.deleteRow', function (evt) {
                    evt.preventDefault();
                    storageEngine.delete('task', $(evt.target).data().taskId,
                        function(){
                            $(evt.target).parents('tr').remove(); //$taskPage.find( NOT REQUIRED as evt already constrained by previous line
                        tasksController.loadTasks();
                        updateTaskCounter();
                        bandTableRows();
                        }, errorLogger);
                });



                $taskPage.find('#saveTask').click(function (evt) {
                    evt.preventDefault();
                    if ($taskPage.find('form').valid()){
                        var task = $taskPage.find('form').toObject();
                        task.complete=false;
                        storageEngine.save("task", task,
                            function(){

                                // updateTaskCounter();
                                // bandTableRows();
                                tasksController.loadTasks(); //refresh table from memory (including edited task)
                                clearTask();
                                // $(':input').val(''); //clear add/edit form fields
                                $taskPage.find('#taskCreation').addClass('not'); //hide add/edit form
                            }, errorLogger);
                    }
                });

                $taskPage.find('#clearTask').click(function (evt) {
                    evt.preventDefault();
                    clearTask();
                })

                $taskPage.find('#tblTasks tbody').on('click', '.editRow', function(evt){
                    $taskPage.find('#taskCreation').removeClass('not'); //display the add/edit form
                    storageEngine.findById('task', $(evt.target).data().taskId,
                        function(task){                                 //if task is found (it definitely will be. Why?)
                            $taskPage.find('form').fromObject(task);    //this success callback will flush the task's data
                        }, errorLogger);                                //into the add/edit form ready for editing
                });

                $($taskPage.find('#taskForm')).validate({
                    rules: {task: {maxlength: 20}}
                });
                //slide 13
                $taskPage.find('#tblTasks tbody').on('click','.completeRow',function (evt) {
                    storageEngine.findById('task',$(evt.target).data().taskId,function (task) {
                        task.complete=true;
                        storageEngine.save('task',task,function () {
                            tasksController.loadTasks();
                        },errorLogger)
                    },errorLogger)
                });

                $('#importFile').change(loadFromCSV);

                $taskPage.find('#btnOutput').click(function (evt) {
                    evt.preventDefault();
                    // console.log('here');
                    storageEngine.findAll('task',function (tasks) {
                        var data=tasks;
                        // var strData=JSON.stringify(data)
                        // console.log(data)
                        var csvRows=[];
                        for(var i=0;i<data.length;i++){
                            // csvRows.push(JSON.stringify(data[i]));
                            var row=JSON.stringify(data[i]);
                            row=row.replace('{','');
                            row=row.replace('}','');
                            // console.log(row);
                            csvRows.push(row);

                        }

                        console.log(csvRows)
                        var csvString = csvRows.join("\n");
                        var a         = document.createElement('a');
                        a.href        = 'data:attachment/csv,' +  encodeURIComponent(csvString);
                        a.target      = '_blank';
                        a.download    = 'myFile.csv';

                        // document.body.appendChild(a);
                        a.click();




                    },errorLogger)
                })


                $taskPage.find('#btnUncheckedExceptionTest').click(function (evt) {
                    evt.preventDefault();
                    logPropertyValue(undefined,'someProperty');

                })

                $taskPage.find('#btnAjaxTest').click(function (evt) {
                    evt.preventDefault();
                    ajaxTest1();
                    //ajaxTest2();
                })
                initialised = true;
            }
        },
        loadTasks: function() {
            $taskPage.find('#tblTasks tbody').empty(); //clear all task rows
            storageEngine.findAll('task', function(tasks){
                tasks.sort(function (task1, task2) {
                    var date1,date2;
                    date1=Date.parse(task1.requiredBy);
                    date2=Date.parse(task2.requiredBy);

                    return date1.compareTo(date2);
                })

                $.each(tasks, function(index, task){
                    $('#taskRow').tmpl(task).appendTo($taskPage.find('#tblTasks tbody'));
                });
                taskCount=tasks.length;
                console.log('1')
                updateTaskCounter();
                bandTableRows()
            }, errorLogger);
        }
    }
}();
