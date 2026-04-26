package com.university.exception;

/**
 * Exception thrown when file is invalid (wrong type, too large, etc).
 */
public class InvalidFileException extends RuntimeException {
    public InvalidFileException(String message) {
        super(message);
    }

    public InvalidFileException(String message, Throwable cause) {
        super(message, cause);
    }
}
