import React from 'react';
import { Badge } from '@material-ui/core';
import { styled } from '@material-ui/core/styles';

const StyledBadge = styled(Badge)(({ theme }) => ({
  '& .MuiBadge-badge': {
    marginRight: '20px'
  },
}));

export default function Notification({count}) {
  return (
      <StyledBadge badgeContent={count} color="primary"/>
  );
}