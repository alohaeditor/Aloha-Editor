<?php

    // /controller/github/repos/gitsome/docular/issues?labels=release_1.0.0,enhancement&state=open&_=1370627616460

    class Req {

        //A public reference request portions
        public $uri;
        public $pluginName;
        public $pluginController;
        public $query;
        public $body;

        //Private parsing function
        private function parseURI () {

            if (preg_match("/controller\/([^\/]{1,})\/([^\/]{1,})\/([\s\S]{1,})$/", $this->uri, $matches)) {

                //extract out the plugin name and the plugin controller name from the URI
                $this->pluginName = $matches[1];
                $this->pluginController = $matches[2];

                //remove all this now undeeded info to pass along to the plugin's controller
                $trash = "/^(.*)\/controller\/".$this->pluginName."\/".$this->pluginController."/";
                $this->uri = preg_replace($trash, "", $this->uri);
            }
        }

        public function __construct ($uri) {

            $this->uri = $uri;

            //parse the uri and remove uneeded garbage from the uri
            $this->parseURI();

            //attache get and post data
            $this->query = $_GET;
            $this->body = $_POST;

        }
    }

?>