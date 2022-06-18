import CropSquareIcon from '@mui/icons-material/CropSquare';
import { Box, Chip, Grid, Typography, Link } from '@mui/material';
import BigNumber from 'bignumber.js';
import { useEffect, useState } from 'react';
import { getEmitter } from '../../../../util/emitter.util';
import { GlobalEvent } from '../../../../util/types';
import { BootstrapTooltip } from '../../../common/components/tooltip';
import TwitterIcon from '@mui/icons-material/Twitter';
import TelegramIcon from '@mui/icons-material/Telegram';


export const Footer: React.FC = () => {
  const [networkBlockHeight, setNetworkBlockHeight] = useState(new BigNumber(0))
  const [rotated, setRotated] = useState(false)
  const emitter = getEmitter();

  useEffect(() => {
    const handleEvent = (height: BigNumber) => {
      const heightString = height.toString();
      let heightRef = height;
      if (heightString.length > 1) {
        heightRef = new BigNumber(heightString.substr(heightString.length - 1, heightString.length))
      }
      setRotated(heightRef.mod(2).eq(0));
      setNetworkBlockHeight(height);
    }
    emitter.on(GlobalEvent.NetworkBlockHeightChanged, handleEvent)
    return () => {
      emitter.off(GlobalEvent.NetworkBlockHeightChanged, handleEvent)
    };
  }, [emitter]);

  //https://codepen.io/sosuke/pen/Pjoqqp  //discord-brands.svg #FF6729 - CSS filter generator to convert from black to target hex color
  return (
    <Box sx={{ py: "10px", px: "24px", background: "#171716", color: "#AFAEAC", width: "100%"}}>
      <Grid container justifyContent="center" alignItems="center">
          <Grid container xs={12} md={8} justifyContent="center" alignItems="center" spacing={2}>
            <Grid item>
              <Link color="secondary" underline="none" href={"https://www.vitamincoin.org/home"} target="_blank" sx={{cursor: "pointer"}}>
                vitamincoin
              </Link>
            </Grid>
            <Grid item>
              <Link color="secondary" underline="none" href={"https://vitaminfaucet.com"} target="_blank" sx={{cursor: "pointer"}}>
                faucet
              </Link>
            </Grid>
            <Grid item>
            <Link color="secondary" underline="none" href={"https://swap.vitc.org/"} target="_blank" sx={{cursor: "pointer"}}>
                vitcswap
              </Link>
            </Grid>
          </Grid>
          <Grid direction="row" container xs={12} md={3} justifyContent="center" alignItems="center" spacing={2}>
            <Grid item>
              <Typography style={{fontSize:12}}>Connect to us in</Typography>
            </Grid>
            <Grid item>
            <Link color="secondary" underline="none" href={"https://discord.gg/vitamincoin"} target="_blank" sx={{cursor: "pointer"}}>
              <img alt="staking" src={"./discord-brands.svg"} width="24" style={{filter: "invert(50%) sepia(58%) saturate(2593%) hue-rotate(341deg) brightness(99%) contrast(104%)"}} />
            </Link>
            </Grid>
            <Grid item>
            <Link color="secondary" underline="none" href={"https://twitter.com/vitamin_coin"} target="_blank" sx={{cursor: "pointer"}}>
              <TwitterIcon></TwitterIcon>
            </Link>
            </Grid>
            <Grid item>
            <Link color="secondary" underline="none" href={"https://t.me/vitcofficial"} target="_blank" sx={{cursor: "pointer"}}>
              <TelegramIcon></TelegramIcon>
            </Link>
            </Grid>
          </Grid>
          <Grid direction="row" container xs={12} md={1} justifyContent="right" alignItems="right">
            <Grid item>
              <BootstrapTooltip title="Network block height" placement="top" arrow>
                <Typography variant="caption" sx={{ verticalAlign: "middle", display: "inline-flex" }}>
                  <CropSquareIcon sx={{
                    color: "gray",
                    mr: "2px",
                    transform: rotated ? "rotate(45deg)" : "rotate(0deg)",
                    fontSize: "17px"
                  }} />
                  {networkBlockHeight.toString()}
                </Typography>
              </BootstrapTooltip>
            </Grid>
            <Grid item>
              <BootstrapTooltip title="Version" placement="top" arrow>
                <Chip label={'v' + process.env.REACT_APP_VERSION} variant="outlined" size="small" sx={{color: "#AFAEAC"}}/>
              </BootstrapTooltip>
            </Grid>
        </Grid>
      </Grid>
    </Box>
  )
}
