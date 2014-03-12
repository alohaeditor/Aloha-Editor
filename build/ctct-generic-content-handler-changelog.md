- **ENHANCEMENT**: Enhances the generic content handler removeComments function to remove comments that appear
                   as text nodes in Firefox.  This change also refactors the code in the generic content handler to
                   be configuration driven.  Each sub-handler run by this content handler can be enabled or disabled
                   via the Aloha.settings.contentHandler.handler.generic configuration.