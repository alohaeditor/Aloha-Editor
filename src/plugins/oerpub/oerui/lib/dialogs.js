/* This code listens to the aloha.toolbar.adopt event, which is published
   by our new toolbar. If it can find the relevant place, it places the
   registered component, and sends it back on the event object */

define(['aloha', 'jquery', 'PubSub', 'bubble/bubble-plugin', 'image/image-plugin'], function(
    Aloha, $, PubSub, BubblePlugin, ImagePlugin){

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
            var $el = this;
            var $bubble = $('<div />', {class: 'link-popover'});
            var $button1 = $('<button class="btn"><i class="icon-certificate"></i> Advanced Options</button>');
            var $button2 = $('<button class="btn btn-danger action-delete"><i class="icon-ban-circle icon-white"></i> Remove</button>');

            $bubble.append($button1);
            $bubble.append($button2);

            editable = Aloha.activeEditable; //squirel squirel
            $button1.on('click', function(e){
                Aloha.activeEditable = editable;

                // Simulate the click so image plugin initialises the dialog
                evt = $.Event('click')
                evt.target = $el[0]
                ImagePlugin.clickImage(evt);

                $('.scope.image').modal({backdrop: false});
                e.preventDefault();
            });
            $button2.on('click', function(e){
                $el.remove();
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
