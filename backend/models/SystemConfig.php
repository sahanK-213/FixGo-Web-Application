<?php

class SystemConfig {
    private $termsFilePath;

    public function __construct() {
        $this->termsFilePath = __DIR__ . '/../config/terms.json';
    }

    public function getTerms() {
        if (file_exists($this->termsFilePath)) {
            $json = file_get_contents($this->termsFilePath);
            $data = json_decode($json, true);
            return $data !== null ? $data : [];
        }
        return [];
    }

    public function updateTerms($termsArray) {
        $json = json_encode($termsArray, JSON_PRETTY_PRINT);
        return file_put_contents($this->termsFilePath, $json) !== false;
    }
}
?>
