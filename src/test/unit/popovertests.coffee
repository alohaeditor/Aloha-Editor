
# Load local testutils.js
require ['testutils'], (TestUtils) ->

  # Once Aloha is configured load the Popover (Popover) plugin
  Aloha.ready ->
    Aloha.require ['popover'], (Popover) ->
      Popover.MILLISECS = 500

      # setTimeout has the millisecs argument come after the function (which is annoying)
      timeout = (ms, func) -> setTimeout(func, ms)

      # The popover takes some time do do things (2000ms)
      # This time ensures enough time has passed (This should be configured on the popover plugin)
      MILLISECS = Popover.MILLISECS * 1.5
      MS_SHORT = Popover.MILLISECS / 20 # Needs to be <500ms (the time it takes to move the mouse from the element onto the popover)
      MS_LONG = MILLISECS * 2

      # Use this to see if the Popover rendered. Set it to null before the popover should show up
      POPULATED = null
      POPOVER_VISIBLE = null # Could be null, true (visible), or false (hidden)
      Popover.register
        hover: true # When the user hovers over text the popover shows up
        selector: '.interesting'
        filter: ->
          Aloha.jQuery(@).hasClass 'interesting'

        focus: () -> POPOVER_VISIBLE = true
        blur: () ->  POPOVER_VISIBLE = false

        populator: ($el, $popover) ->
          POPULATED =
            dom: $el
            popover: $popover

      module 'Popover (generic)',
        setup: ->
          @edit = Aloha.jQuery('#edit')
          @edit.html ''
          @edit.aloha()
          POPULATED = null

        teardown: ->
          @edit.mahalo()
          POPULATED = null

      # module
      asyncTest 'element mouseenter', ->
        expect 2
        Aloha.jQuery('<span class="boring">boring</span><span class="interesting">interesting</span>').appendTo @edit
        $boring = @edit.find('.boring')
        $interesting = @edit.find('.interesting')

        # Click somewhere in the editor so popover events get bound
        @edit.focus()
        ok not POPULATED, 'The popover hould not have displayed yet'
        $interesting.trigger 'mouseenter'
        timeout MILLISECS, ->
          ok POPULATED, 'The popover should have popped up'
          start()

      asyncTest 'element click', ->
        expect 2
        Aloha.jQuery('<span class="boring">boring</span><span class="interesting">interesting</span>').appendTo @edit
        $boring = @edit.find('.boring')
        $interesting = @edit.find('.interesting')

        # Click somewhere in the editor so popover events get bound
        TestUtils.setCursor @edit, $boring[0], 1
        ok not POPULATED, 'The popover should not have displayed yet'
        TestUtils.setCursor @edit, $interesting[0], 1 # Using index 1 because of webkit bug. see rangy.createModule.selProto.addRange 'Happens in WebKit with, for example, a selection placed at the start of a text node'
        timeout MILLISECS, ->
          ok POPULATED, 'The popover should have popped up'
          start()


      # 1. Hover over the text (causing the popover to show up)
      # 2. Wait for the popover to show up
      # 3. Move the mouse off of the element
      # 4. Move the mouse onto the popover (<500ms)
      # 5. Wait 5 seconds
      # 6. Confirm the popover did not disappear
      asyncTest 'popover mouseenter (Make sure the popover does not hide when mouse moves onto the popover)', ->
        expect 4
        Aloha.jQuery('<span class="boring">boring</span><span class="interesting">interesting</span>').appendTo @edit
        $boring = @edit.find('.boring')
        $interesting = @edit.find('.interesting')

        # Click somewhere in the editor so popover events get bound
        TestUtils.setCursor @edit, $boring[0], 1
        ok not POPULATED, 'The popover should not have displayed yet'

        # 1. Hover over the text (causing the popover to show up)
        $interesting.trigger 'mouseenter'
        # 2. Wait for the popover to show up
        timeout MILLISECS, ->
          ok POPULATED, 'The popover should have popped up'
          ok POPOVER_VISIBLE, 'The popover should be visible'

          # 3. Move the mouse off of the element
          $interesting.trigger 'mouseleave'

          # 4. Move the mouse onto the popover (<500ms)
          timeout MS_SHORT, ->
            POPULATED.dom.data('popover').$tip.trigger('mouseenter')
            # 5. Wait 5 seconds
            timeout MS_LONG, ->
              # 6. Confirm the popover did not disappear
              ok(POPOVER_VISIBLE, 'Popover should still be visible')
              start()


      # 1. Hover over the text (causing the popover to show up)
      # 2. Wait for the popover to show up
      # 3. Move the mouse off of the element
      # 4. Move the mouse onto the popover (<500ms)
      # 5. Move the mouse off of the popover
      # 6. Wait 5 seconds
      # 7. Confirm the popover DID disappear
      asyncTest 'popover mouseenter2 (Make sure the popover DOES hide when mouse moves off the popover)', ->
        expect 4
        Aloha.jQuery('<span class="boring">boring</span><span class="interesting">interesting</span>').appendTo @edit
        $boring = @edit.find('.boring')
        $interesting = @edit.find('.interesting')

        # Click somewhere in the editor so popover events get bound
        TestUtils.setCursor @edit, $boring[0], 1
        ok not POPULATED, 'The popover should not have displayed yet'

        # 1. Hover over the text (causing the popover to show up)
        $interesting.trigger 'mouseenter'
        # 2. Wait for the popover to show up
        timeout MILLISECS, ->
          ok POPULATED, 'The popover should have popped up'
          ok POPOVER_VISIBLE, 'The popover should be visible'

          # 3. Move the mouse off of the element
          $interesting.trigger 'mouseleave'

          # 4. Move the mouse onto the popover (<500ms)
          timeout MS_SHORT, ->
            POPULATED.dom.data('popover').$tip.trigger('mouseenter')
            # 5. Move the mouse off of the popover
            POPULATED.dom.data('popover').$tip.trigger('mouseleave')
            # 6. Wait 5 seconds
            timeout MS_LONG, ->
              # 7. Confirm the popover DID disappear
              ok(not POPOVER_VISIBLE, 'Popover should have disappeared')
              start()
