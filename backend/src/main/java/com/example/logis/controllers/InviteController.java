package com.example.logis.controllers;

import com.example.logis.data.entities.User;
import com.example.logis.dtos.responses.InvitationResponse;
import com.example.logis.dtos.requests.InviteUserRequest;
import com.example.logis.services.InviteService;
import jakarta.validation.Valid;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
public class InviteController {
    private final InviteService inviteService;
    public InviteController(InviteService inviteService){
        this.inviteService = inviteService;
    }

    @GetMapping("/invites")
    public List<InvitationResponse> getInvites(@AuthenticationPrincipal User user){
        return inviteService.getUserInvites(user.getId()).stream()
                .map(inviteService::toResponse)
                .toList();
    }

    @GetMapping("/invites/sent")
    public List<InvitationResponse> getSentInvites(@AuthenticationPrincipal User user){
        return inviteService.getInvitesSentBy(user.getId()).stream()
                .map(inviteService::toResponse)
                .toList();
    }

    @PostMapping("/invites")
    public InvitationResponse invite(@Valid @RequestBody InviteUserRequest request, @AuthenticationPrincipal User user){
        return inviteService.createInvitation(user.getId(), request.email());
    }

    @GetMapping("/invites/{token}")
    public InvitationResponse getInvitation(@PathVariable String token){
        return inviteService.getInvitation(token);
    }

    @PostMapping("/invites/{token}")
    public void acceptInvite(@PathVariable String token, @AuthenticationPrincipal User user){
        inviteService.acceptInvite(token, user.getId());
    }
}
