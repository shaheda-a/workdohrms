<?php

namespace App\Exceptions;

class InvalidCredentialsException extends AuthenticationException
{
    public function __construct(string $message = 'The provided credentials are incorrect.')
    {
        parent::__construct($message, 422, [
            'email' => [$message],
        ]);
    }
}
