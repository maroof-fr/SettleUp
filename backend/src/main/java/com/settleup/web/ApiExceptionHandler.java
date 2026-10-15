package com.settleup.web;

import java.util.Map;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.http.converter.HttpMessageNotReadableException;
import org.springframework.validation.FieldError;
import org.springframework.web.bind.MethodArgumentNotValidException;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.RestControllerAdvice;

/** Every error becomes {"message": "..."}, which the frontend shows to the user. */
@RestControllerAdvice
public class ApiExceptionHandler {
    private static ResponseEntity<Map<String, String>> body(HttpStatus s, String m) { return ResponseEntity.status(s).body(Map.of("message", m)); }

    @ExceptionHandler(ApiException.class)
    ResponseEntity<Map<String, String>> api(ApiException e) { return body(e.getStatus(), e.getMessage()); }

    @ExceptionHandler(MethodArgumentNotValidException.class)
    ResponseEntity<Map<String, String>> invalid(MethodArgumentNotValidException e) {
        String m = e.getBindingResult().getFieldErrors().stream().map(FieldError::getDefaultMessage).findFirst().orElse("Invalid request.");
        return body(HttpStatus.BAD_REQUEST, m);
    }

    @ExceptionHandler(HttpMessageNotReadableException.class)
    ResponseEntity<Map<String, String>> unreadable(HttpMessageNotReadableException e) { return body(HttpStatus.BAD_REQUEST, "Malformed request body."); }
}
