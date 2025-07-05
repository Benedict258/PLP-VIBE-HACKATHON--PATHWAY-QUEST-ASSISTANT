
-- Add foreign key constraints to enable proper joins
ALTER TABLE partners
ADD CONSTRAINT fk_partner_profile
FOREIGN KEY (partner_id)
REFERENCES profiles(id);

ALTER TABLE team_members
ADD CONSTRAINT fk_team_member_profile
FOREIGN KEY (user_id)
REFERENCES profiles(id);
