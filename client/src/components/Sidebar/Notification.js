import React from 'react';
import { Typography } from "@material-ui/core";
import { makeStyles } from "@material-ui/core/styles";

const useStyles = makeStyles((theme) => ({
  count: {
    fontSize: 12,
    width: '20px',
    height: '20px',
    borderRadius: '10px',
    marginRight: '15px',
    color: "white",
    textAlign: 'center',
    paddingTop: '1px',
    backgroundColor: '#3F92FF',
  },
}));
const Notification = ({count}) => {
    const classes = useStyles();
    return (
        <>
            { count>0 && <Typography className={classes.count}>{count}</Typography>}
        </>
    )
}

export default Notification