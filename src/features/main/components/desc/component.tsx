import {Grid, Typography, Box, Link} from "@mui/material";
import React from 'react';

export const Desc: React.FC = () => {
  return (
    <Grid container justifyContent="center" alignItems="center">  
        <Grid item xs={12} md={6} lg={6}>
          <Box p={2}>
          <Box>
            <Typography color="text.secondary">
              <h1>Earn beefy staking rewards with VITCStake!</h1>
            </Typography>
            <Typography color="text.secondary">
              <h3>Easily claim free vitamincoin from our&nbsp;
                <Link color="secondary" underline="none" href={"https://vitaminfaucet.com"} target="_blank" sx={{cursor: "pointer"}}>
                  faucet
                </Link>
                , or earn in our&nbsp;
                <Link color="secondary" underline="none" href={"https://discord.gg/vitamincoin"} target="_blank" sx={{cursor: "pointer"}}>
                  Discord
                </Link>
                </h3>
            </Typography>
            <Typography color="text.secondary">
              <h3>Connect your Vite wallet and start earning right away</h3>
            </Typography>
            </Box>
          </Box>
        </Grid>
        <Grid container xs={12} md={6} lg={6} alignItems="center" justifyContent="center" direction="column">
          <Box p={2}>
            <img alt="staking" src={"./Vault_gradient.png"} width="350" />
          </Box>
        </Grid>     
    </Grid>
  )
}
