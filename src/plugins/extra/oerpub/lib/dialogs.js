/* This code listens to the aloha.toolbar.adopt event, which is published
   by our new toolbar. If it can find the relevant place, it places the
   registered component, and sends it back on the event object */

define(['aloha', 'jquery', 'PubSub', 'bubble/bubble-plugin'], function(
    Aloha, $, PubSub, BubblePlugin){

    // Subscribe to adoption event, register components
    PubSub.sub('aloha.toolbar.adopt', function(evt){
        CONTAINER_JQUERY = $('.toolbar');
        $placeholder = CONTAINER_JQUERY.find(".component." + evt.params.slot);
        if($placeholder.length){
            Type = evt.params.settings ? evt.params.type.extend(evt.params.settings) : evt.params.type;
            evt.component = new Type();
            $placeholder.append(evt.component.element);
            evt.preventDefault();
        }
    });

    // Register bubble for images
    bubbleconfig = {
        selector: 'img',
        populator: function(){
            var $bubble = $('<div />', {class: 'link-popover'});
            var $button = $('<button class="btn"><i class="icon-certificate"></i> Advanced Options</button>');
            $bubble.append($button);

            editable = Aloha.activeEditable; //squirel squirel
            $bubble.on('click', function(e){
                Aloha.activeEditable = editable;
                $('.scope.image').modal({backdrop: false});
                e.preventDefault();
            });
            return $bubble;
        },
        filter: function(){ return this.nodeName.toLowerCase() === 'img'; },
        placement: 'bottom',
        focus: function(){},
        blur: function(){}
    };
    BubblePlugin.register(bubbleconfig)
});
