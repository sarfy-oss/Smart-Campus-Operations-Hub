package com.university.controller;

import com.university.entity.Notification;
import com.university.entity.NotificationType;
import com.university.entity.User;
import com.university.repository.UserRepository;
import com.university.service.NotificationService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/notifications")
@RequiredArgsConstructor
public class NotificationController {

    private final NotificationService notificationService;
    private final UserRepository userRepository;

    @GetMapping
    public ResponseEntity<List<Notification>> getMyNotifications(Authentication authentication) {
        User user = resolveUser(authentication);
        return ResponseEntity.ok(notificationService.getUserNotifications(user.getId()));
    }

    @PutMapping("/{id}/read")
    public ResponseEntity<?> markAsRead(@PathVariable String id, Authentication authentication) {
        return notificationService.markAsRead(id)
                .map(n -> ResponseEntity.ok((Object) n))
                .orElse(ResponseEntity.notFound().build());
    }

    @PutMapping("/read-all")
    public ResponseEntity<Map<String, String>> markAllAsRead(Authentication authentication) {
        User user = resolveUser(authentication);
        notificationService.markAllAsRead(user.getId());
        return ResponseEntity.ok(Map.of("message", "All notifications marked as read"));
    }

    @PostMapping
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<Notification> createNotification(
            @RequestBody Map<String, String> body,
            Authentication authentication) {

        String targetUserId = body.get("userId");
        String message = body.get("message");
        String typeStr = body.getOrDefault("type", "SYSTEM");

        if (targetUserId == null || message == null) {
            return ResponseEntity.badRequest().build();
        }

        NotificationType type;
        try {
            type = NotificationType.valueOf(typeStr);
        } catch (IllegalArgumentException e) {
            type = NotificationType.SYSTEM;
        }

        Notification notification = notificationService.createNotification(targetUserId, message, type);
        return ResponseEntity.status(HttpStatus.CREATED).body(notification);
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Map<String, String>> deleteNotification(
            @PathVariable String id, Authentication authentication) {
        User user = resolveUser(authentication);
        boolean deleted = notificationService.deleteNotification(id, user.getId());
        if (deleted) {
            return ResponseEntity.ok(Map.of("message", "Notification deleted"));
        }
        return ResponseEntity.status(HttpStatus.NOT_FOUND)
                .body(Map.of("message", "Notification not found or not yours"));
    }

    private User resolveUser(Authentication authentication) {
        return userRepository.findByUsername(authentication.getName()).orElseThrow();
    }
}
