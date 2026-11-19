package com.groupawards.controller;

import com.groupawards.dto.NominationDtos.NominationCard;
import com.groupawards.dto.NominationDtos.VoteRequest;
import com.groupawards.service.NominationService;
import com.groupawards.util.SecurityUtils;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api")
@RequiredArgsConstructor
public class NominationController {

    private final NominationService nominationService;

    @GetMapping("/nominations")
    public List<NominationCard> list() {
        return nominationService.listForUser(SecurityUtils.currentUserId());
    }

    @GetMapping("/nominations/{id}")
    public NominationCard get(@PathVariable Long id) {
        return nominationService.getForUser(id, SecurityUtils.currentUserId());
    }

    @PostMapping("/votes")
    public void vote(@RequestBody VoteRequest request) {
        nominationService.castVote(SecurityUtils.currentUserId(), request);
    }
}
