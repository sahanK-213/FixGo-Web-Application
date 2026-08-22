<?php
use PHPUnit\Framework\TestCase;

class ValidationUnitTest extends TestCase {

    // Helper functions mirroring the logic in CustomerController and ShopController

    private function validateName($name) {
        $name = trim($name);
        if (mb_strlen($name) < 2 || preg_match('/^\d+$/', $name) || !preg_match('/^[a-zA-Z\p{L}\s\.\'-]{2,100}$/u', $name)) {
            return false;
        }
        return true;
    }

    private function validateEmail($email) {
        $sanitizedEmail = filter_var($email, FILTER_SANITIZE_EMAIL);
        return filter_var($sanitizedEmail, FILTER_VALIDATE_EMAIL) !== false;
    }

    private function validatePhone($phone) {
        return preg_match('/^(?:\+94\d{9}|0\d{9})$/', $phone) === 1;
    }

    private function validateAddress($address) {
        if (mb_strlen($address) < 5 || preg_match('/^(n\/?a|none|nil|null|test|no|abc)$/i', $address)) {
            return false;
        }
        return true;
    }

    // --- Tests ---

    public function testValidSriLankaPhoneFormats() {
        $this->assertTrue($this->validatePhone('+94712345678'));
        $this->assertTrue($this->validatePhone('0712345678'));
    }

    public function testInvalidPhoneFormats() {
        $this->assertFalse($this->validatePhone('123'));
        $this->assertFalse($this->validatePhone('07123456789')); // 11 digits
        $this->assertFalse($this->validatePhone('+1234'));
        $this->assertFalse($this->validatePhone('071234ABCD'));
    }

    public function testValidEmailFormats() {
        $this->assertTrue($this->validateEmail('user@gmail.com'));
        $this->assertTrue($this->validateEmail('firstname.lastname@domain.co'));
    }

    public function testInvalidEmailFormats() {
        $this->assertFalse($this->validateEmail('user@'));
        $this->assertFalse($this->validateEmail('@domain.com'));
        $this->assertFalse($this->validateEmail('plaintext'));
    }

    public function testValidName() {
        $this->assertTrue($this->validateName('John Doe'));
        $this->assertTrue($this->validateName('S.M. Perera'));
        $this->assertTrue($this->validateName('O\'Connor'));
    }

    public function testInvalidNameNumbers() {
        $this->assertFalse($this->validateName('123456'));
        $this->assertFalse($this->validateName('1John'));
    }

    public function testInvalidNameTooShort() {
        $this->assertFalse($this->validateName('A'));
    }

    public function testValidAddress() {
        $this->assertTrue($this->validateAddress('123 Main Street, Colombo'));
        $this->assertTrue($this->validateAddress('No 5, Kandy Road'));
    }

    public function testInvalidAddressPlaceholder() {
        $this->assertFalse($this->validateAddress('N/A'));
        $this->assertFalse($this->validateAddress('n/a'));
        $this->assertFalse($this->validateAddress('none'));
        $this->assertFalse($this->validateAddress('nil'));
        $this->assertFalse($this->validateAddress('test'));
    }

    public function testInvalidAddressTooShort() {
        $this->assertFalse($this->validateAddress('No5')); // 3 chars
    }
}
