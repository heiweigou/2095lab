storageEngine = function(){
    var initialized = false;
    var initializedObjectStores = {};
    function getStorageObject(type){
        var item = localStorage.getItem(type); //get store as String
        var parsedItem = JSON.parse(item); //parse to a JS object
        return parsedItem;
    }

    return{
        init: function(successCallback, errorCallback){ //success callback includes a call to loadTasks
            if (window.localStorage){
                initialized = true;
                successCallback(null);
            }
            else{
                errorCallback('storage_api_not_supported', 'The web storage api is not supported');
            }
        },
        initObjectStore: function(type, successCallback, errorCallback){
            if (!initialized){
                errorCallback('storage_api_not_initialized', 'The storage engine has not been initialized');
            }
            else if (!localStorage.getItem(type)){ //no store for specified type
                localStorage.setItem(type, JSON.stringify({})); //***HALT*** SYNCHRONOUS for Web Storage, NOTE: no callback passed to setItem
                successCallback(null); //can't execute until object store ready (because it contains loadTasks)
            }
            else if (localStorage.getItem(type)){ //existing store for specified type found
                initializedObjectStores[type] = true;
                successCallback(null); // //can't execute unless object store exists (because it contains loadTasks)
            }
        },
        save: function(type, obj, successCallback, errorCallback){
            if (!initialized)
                errorCallback('storage_api_not_initialized', 'The storage engine has not been initialized');
            else if (!initializedObjectStores[type])
                errorCallback('store_not_initialized', '1. The object store ' + type + ' has not been initialized');
            else{
                if (!obj.id) //if no key
                    obj.id = $.now(); //key is current time in milliseconds
                var storageItem = getStorageObject(type); //get store as a JS object
                storageItem[obj.id] = obj; //add new task to task store
                localStorage.setItem(type, JSON.stringify(storageItem)); //put store back
                successCallback(obj);
            }
        },
        findAll: function(type, successCallback, errorCallback){
            if (!initialized)
                errorCallback('storage_api_not_initialized', 'The storage engine has not been initialized');
            else if (!initializedObjectStores[type])
                errorCallback('store_not_initialized', '2. The object store ' + type + ' has not been initialized');
            else{
                var result = [];
                var storageItem = getStorageObject(type); //get tasks store as a JS object (it's property values are task objects)
                $.each(storageItem, function(i, v){ //$.each is generic iterator that is iterating over a JS object in this case
                                                    //when iterating over a JS object i = prop name, v = prop value (task objects)
                    result.push(v); //v is the task object being processed in the current iteration
                });
                successCallback(result); //result is an array of task objects (including there id property)
            }
        },
        delete: function(type, id, successCallback, errorCallback){
            if (!initialized)
                errorCallback('storage_api_not_initialized', 'The storage engine has not been initialized');
            else if (!initializedObjectStores[type])
                errorCallback('store_not_initialized', '2. The object store ' + type + ' has not been initialized');
            else{
                var storageItem = getStorageObject(type); //get store as a JS object
                if (storageItem[id]){
                    delete storageItem[id]; //JS syntax to delete a property of an object
                    localStorage.setItem(type, JSON.stringify(storageItem)); //put store back 1 task lighter
                    successCallback(id);
                }
                else
                    errorCallback("object_not_found", "The object to be deleted could not be found");
            }
        },
        findByProperty: function(type, propertyName, propertyValue,successCallback, errorCallback){
            if (!initialized)
                errorCallback('storage_api_not_initialized', 'The storage engine has not been initialized');
            else if (!initializedObjectStores[type])
                errorCallback('store_not_initialized', '2. The object store ' + type + ' has not been initialized');
            else{
                var result = [];
                var storageItem = getStorageObject(type); //get store as a JS object (it's property values are task objects)
                $.each(storageItem, function(i, v){
                    if(v[propertyName] === propertyValue)
                        result.push(v);
                });
                successCallback(result);
            }
        },
        findById: function(type, id, successCallback, errorCallback){
            if (!initialized)
                errorCallback('storage_api_not_initialized', 'The storage engine has not been initialized');
            else if (!initializedObjectStores[type])
                errorCallback('store_not_initialized', '2. The object store ' + type + ' has not been initialized');
            else{
                var storageItem = getStorageObject(type); //get store as a JS object (it's property values are task objects)
                var result = storageItem[id];
                if (!result)
                    result = null; //as per generic API spec
                successCallback(result); //
            }
        },
        saveAll:function (type, objArray, successCallback, errorCallback) {

                if (!initialized)
                    errorCallback('storage_api_not_initialized', 'The storage engine has not been initialized');
                else if (!initializedObjectStores[type])
                    errorCallback('store_not_initialized', '2. The object store ' + type + ' has not been initialized');
                else {
                    var storageItem = getStorageObject(type);
                    $.each(objArray, function (i, obj) {
                        if (!obj.id)
                            obj.id = $.now()+i;
                            storageItem[obj.id] = obj;
                        console.log(obj);
                        localStorage.setItem(type, JSON.stringify(storageItem));

                        });

                    successCallback(objArray);
                }
        }

    };
}();
