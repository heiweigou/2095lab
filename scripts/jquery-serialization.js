(function($) {
    $.fn.extend({
        toObject: function(){
            //implement toObject
            var result = {};
            $.each(this.serializeArray(), function(i, v){
                result[v.name] = v.value;
            });
            return result;
        },
        fromObject: function(obj) {
            //implement fromObject
            $.each(this.find(':input'), function(i, v){
                var name = $(v).attr('name');
                if (obj[name])
                    $(v).val(obj[name]);
                //v.value = obj[name];
                else
                    $(v).val('');
                //v.value = '';
            });
        }
    });
})(jQuery);
