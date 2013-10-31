<?php

    class RequestAPI {

        //public addQueryParams
        public function addQueryParams ($uri, $queryParams) {

            $query = "";
            if(strpos($uri, "?") === FALSE){
                $glue = "?";
            } else {
                $glue = "&";
            }

            foreach($queryParams as $param=>$paramVal) {
                $uri = $uri.$glue.$param."=".$paramVal;
                $glue = "&";
            }
            return $uri;
        }

        public function request ($uri, $headers) {

            $headersMerged = array();
            foreach($headers as $key => $value){
                array_push($headersMerged, $key.": ".$value);
            }

            $ch = curl_init($uri);
            curl_setopt($ch, CURLOPT_HTTPHEADER, $headersMerged);
            curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
            return curl_exec($ch);
            curl_close($ch);

        }

        public function __construct () {}
    }

?>