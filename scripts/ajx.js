$.ajax({
    type:'GET',
    dataType:'json',
    url:'../tasks.json',
    cache:false,
    success:function (data) {
        console.log(data);
    }
})

$.getJSON('../tasks.json',function (data) {
    console.log(data);
})