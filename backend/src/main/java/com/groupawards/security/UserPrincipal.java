package com.groupawards.security;

import com.groupawards.entity.AppUser;
import com.groupawards.entity.Role;
import lombok.Getter;
import org.springframework.security.core.GrantedAuthority;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.core.userdetails.UserDetails;

import java.util.Collection;
import java.util.List;

@Getter
public class UserPrincipal implements UserDetails {

    private final Long id;
    private final String username;
    private final String password;
    private final Role role;
    private final boolean mustChangePassword;

    public UserPrincipal(AppUser user) {
        this.id = user.getId();
        this.username = user.getAdminLogin() != null
                ? user.getAdminLogin()
                : (user.getUsername() != null ? user.getUsername() : "tg_" + user.getTelegramId());
        this.password = user.getPasswordHash();
        this.role = user.getRole();
        this.mustChangePassword = user.isMustChangePassword();
    }

    @Override
    public Collection<? extends GrantedAuthority> getAuthorities() {
        return List.of(new SimpleGrantedAuthority("ROLE_" + role.name()));
    }

    @Override
    public boolean isAccountNonExpired() {
        return true;
    }

    @Override
    public boolean isAccountNonLocked() {
        return true;
    }

    @Override
    public boolean isCredentialsNonExpired() {
        return true;
    }

    @Override
    public boolean isEnabled() {
        return true;
    }
}
