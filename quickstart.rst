=====================================
Get a dev environment for Aloha setup
=====================================

This sets up a development environment for the Aloha editor, master branch, on Ubuntu
12.04.

System dependencies
-------------------

Install git and family::

    sudo apt-get install git, tig, gitk

Install nginx (or you could use apache and your own instructions)::

    sudo apt-get install nginx

Start nginx::

    sudo /etc/init.d/nginx start

Test the nginx install by executing::

    chromium-browser http://localhost:80

    You should see a page with a welcome message. Something like:
    Welcome to nginx!

Get the code
------------

Clone the repo::

    git clone  https://github.com/wysiwhat/Aloha-Editor.git aloha-editor
    
    NOTE: This will take a while.

Check that you are on the correct branch::

    git branch

    You should be on the 'master' branch.

Get the nginx instance to serve your dev files
----------------------------------------------

Go to the nginx root folder::

    Normally that means:
    cd /usr/share/nginx/www
    
    If it is not there, look in /etc/nginx/sites-enabled/default. It will show
    what the 'root' folder is.

Symlink your dev sandbox here::
    
    sudo ln -s [path-to-checkout] Aloha-Editor

    NOTE: The capitalization of 'Aloha-Editor' is necessary due to the way
    the links to css and javascript is set up in the html files.

Check if it works::

    chromium-browser http://localhost/Aloha-Editor

    You should see a page with a lot of text and the heading, 
    'Welcome to WYSIWHAT: A semantic HTML5 editor for textbooks, books, and
    open education resources'

Open the OERPub editor::

    chromium-browser http://localhost/Aloha-Editor/oerpub/index.html

Open the Connexions Editor Demo::

    chromium-browser http://localhost/Aloha-Editor/cnx.html
