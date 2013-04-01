### Contributor Guidelines

Sign the Contributor License Agreement

Very important, before we can accept your code into our repository, we will need you to sign the Aloha Editor contributor license agreement (CLA). Signing the contributor's agreement does not grant anyone commit rights to the main repository, but it does mean that we can accept your contributions, and you will get an author credit if we do. Active contributors might be asked to join the core team, and given the ability to merge pull requests. In order to read and sign the CLA, please go to:

http://aloha-editor.org/contribution.php

# Commit Checklist

Make sure to stick to our **Commit Checklist** or your changes most likely won't make it :)

Prior to each commit be sure to obey the n commandments of committing to Aloha Editor:

1. obey [coding guidelines](http://www.aloha-editor.org/guides/style_guide.html)
1. write JSLint compliant code
1. write **JSDoc** for every method you touched during your implementation
1. write a **human-readable :) [Changelog](https://github.com/alohaeditor/Aloha-Editor/wiki/Changelog)** entry that describes your change
1. add a **qunit test** (if it makes sense) and/or document the **steps to manually test it** (in a separate guides page)
1. test your changes in Internet Explorer 7, 8, 9 and the latest Firefox and latest Chrome
1. document your changes in a **guides page**
1. include this list in a your **pull request**

# Pull Request Rules

1. Create separate branches from which you create a pull request. This has the advantage that you don't pollute your pull request branch with multiple commits. Once a branch is polluted with many commits it is very hard to merge it. 

We suggest creating branches for hotfixes, docu changes and for each new feature or changed feature a new branch. If possible those branches should always be branched from upstream.

1. Do *not* pull your own pull requests ;)

1. Add the commit checklist at the bottom to your pull request.

1. Avoid merge commits - try to keep your local branches clean and uptodate. Use **git rebase upstream/BRANCHNAME** if needed to stack your changes ontop of the HEAD revision of the upstream branch.

1. Don't rename merge commits. Let git handle those commits.

1. Don't add additional changes to merge commits.


