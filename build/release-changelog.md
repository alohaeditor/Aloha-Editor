- **BUG**: browser-plugin: The browser will now open at a more centered position.
- **BUG**: core: A IE7 crash workaround was reverted because it caused all eventhandlers to be lost when getContents() was invoked. The new workaround will remove the jquery expando attributes in IE7 for some elements.
- **BUG**: core: Fixes bugs in the handeling of delete and forward delete.
				 These bugs were introduced in an attempt to fix issues with
				 deleting behaviour near multiple white spaces.  An alernative
				 should be sought for a better solution for handeling white
				 spaces.