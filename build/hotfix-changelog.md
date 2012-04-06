- **BUG** core: UP and DOWN cursor key will now not be processed specially by
          Aloha, they will be left to native handeling.
- **BUG** core: Adds a guard in `execCommand()' to prevent `INDEX_SIZE_ERR'
          exceptions.
- **BUG** core: The cursor processing around non-contenteditable elements
          (blocks) was not functioning as described or desired.  It now behaves
		  with more stability especially on Internet Explorer.
- **ENHANCEMENT** core: Improved efficiency of cursor processing,
                  especially around blocks.
- **FEATURE** core: It is now possible to place the caret between two adjecent
              non-contenteditable elements.
