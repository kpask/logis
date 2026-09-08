package com.example.logis.controllers;

import com.example.logis.data.entities.User;
import com.example.logis.dtos.responses.InvitationResponse;
import com.example.logis.dtos.requests.InviteUserRequest;
import com.example.logis.services.InviteService;
import jakarta.validation.Valid;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
public class InviteController {
    private final InviteService inviteService;
    public InviteController(InviteService inviteService){
        this.inviteService = inviteService;
    }

    @GetMapping("/invites/")
    public List<InvitationResponse> getInvites(Authentication authentication){
        Long userId = ((User) authentication.getPrincipal()).getId();
        return inviteService.getUserInvites(userId).stream()
                .map(inviteService::toResponse)
                .toList();
    }

    @GetMapping("/invites/sent")
    public List<InvitationResponse> getSentInvites(Authentication authentication){
        Long userId = ((User) authentication.getPrincipal()).getId();
        return inviteService.getInvitesSentBy(userId).stream()
                .map(inviteService::toResponse)
                .toList();
    }

    @PostMapping("/invites/")
    public InvitationResponse invite(@Valid @RequestBody InviteUserRequest request, Authentication authentication){
        Long userId = ((User) authentication.getPrincipal()).getId();
        return inviteService.createInvitation(userId, request.email());
    }

    @GetMapping("/invites/{token}")
    public InvitationResponse getInvitation(@PathVariable String token){
        return inviteService.getInvitation(token);
    }

    @PostMapping("/invites/{token}")
    public void acceptInvite(@PathVariable String token, Authentication authentication){
        Long userId = ((User) authentication.getPrincipal()).getId();
        inviteService.acceptInvite(token, userId);
    }
}
