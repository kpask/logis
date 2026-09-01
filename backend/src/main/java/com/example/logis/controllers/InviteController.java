package com.example.logis.controllers;

import com.example.logis.data.User;
import com.example.logis.dtos.InvitationResponse;
import com.example.logis.dtos.InviteUserRequest;
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
        User user = (User) authentication.getPrincipal();
        return inviteService.getUserInvites(user).stream()
                .map(inviteService::toResponse)
                .toList();
    }

    @GetMapping("/invites/sent")
    public List<InvitationResponse> getSentInvites(Authentication authentication){
        User user = (User) authentication.getPrincipal();
        return inviteService.getInvitesSentBy(user).stream()
                .map(inviteService::toResponse)
                .toList();
    }

    @PostMapping("/invites/")
    public InvitationResponse invite(@Valid @RequestBody InviteUserRequest request, Authentication authentication){
        User user = (User) authentication.getPrincipal();
        return inviteService.createInvitation(user, request.email());
    }

    @GetMapping("/invites/{token}")
    public InvitationResponse getInvitation(@PathVariable String token){
        return inviteService.getInvitation(token);
    }

    @PostMapping("/invites/{token}")
    public void acceptInvite(@PathVariable String token, Authentication authentication){
        User user = (User) authentication.getPrincipal();
        inviteService.acceptInvite(token, user);
    }
}
