package com.university.exception;

/**
 * Exception thrown when max attachments (3) exceeded.
 */
public class MaxAttachmentsExceededException extends RuntimeException {
    public MaxAttachmentsExceededException(String message) {
        super(message);
    }

    public MaxAttachmentsExceededException(String message, Throwable cause) {
        super(message, cause);
    }
}
