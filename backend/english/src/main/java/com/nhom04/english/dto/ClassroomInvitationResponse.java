package com.nhom04.english.dto;

import lombok.Builder;
import lombok.Value;

@Value
@Builder
public class ClassroomInvitationResponse {
    Long classroomId;
    String classroomCode;
    String classroomName;
    String classroomDescription;
    String inviteType;
    Long invitedById;
    String invitedByName;
    String invitedByEmail;
}
