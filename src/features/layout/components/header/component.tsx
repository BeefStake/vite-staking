import AccountCircleIcon from '@mui/icons-material/AccountCircle';
import { AppBar, Button, Chip, styled, Toolbar, tooltipClasses, Typography, Grid, Link } from '@mui/material';
import React, { useState, useEffect } from 'react';
import { CommonConstants } from '../../../../common/constants';
import { useConnectedWeb3Context } from '../../../../contexts/connectedWeb3';
import { CommonUtil } from '../../../../util/common.util';
import { BootstrapTooltip } from '../../../common/components/tooltip';
import { LoginDialog } from '../../../main/components/login';
import { NetworkList } from '../../../main/components/network-list';
import IconButton from '@mui/material/IconButton';
import Brightness4Icon from '@mui/icons-material/Brightness4';
import Brightness7Icon from '@mui/icons-material/Brightness7';
import { useThemeMode } from "../../../../hooks/themeContext";

import "../menu/navbar.css";
import DehazeIcon from '@mui/icons-material/Dehaze';

const Root = styled('div')(
  ({ theme }) => `
  flex-grow: 1;
`);

const TitleTypography = styled(Typography)(
  ({ theme }) => `
  flex-grow: 1;
  margin-left: 10px !important;
`);

export const Header: React.FC = (props: any) => {
  const context = useConnectedWeb3Context();
  const [loginOpen, setLoginOpen] = React.useState(false);
  const handleClickLogin = () => {
    setLoginOpen(true);
  };
  const handleClickLogout = () => {
    context.logout();
  };
  const handleLoginClose = () => {
    setLoginOpen(false);
  };
  const truncateAddress = (address?: string) => {
    return CommonUtil.truncateStringInTheMiddle(address, 10, 5)
  }

  const { darkMode, handleDarkMode } = useThemeMode();

  //mobile detect
  const [state, setState] = useState({
    mobileView: false,
    drawerOpen: false,
  });
  const { mobileView } = state;
  useEffect(() => {
    const setResponsiveness = () => {
      return window.innerWidth < 900
        ? setState((prevState) => ({ ...prevState, mobileView: true }))
        : setState((prevState) => ({ ...prevState, mobileView: false }));
    };
    setResponsiveness();
    window.addEventListener("resize", () => setResponsiveness());
    return () => {
      window.removeEventListener("resize", () => setResponsiveness());
    };
  }, []);
  //end mobile detect

  const [isNavExpanded, setIsNavExpanded] = useState(false);

  return (
    <Root>
      <AppBar position="static" color="primary">
        <nav className="navigation">
          <img src={"./vault1.png"} alt="logo" width="60" className='navLogo'/>
          <TitleTypography variant="h6" className='navTitle'>
            {CommonConstants.APP_NAME}
            <TitleTypography sx={{ fontSize: 11 }}>
              By VitaminCoin
            </TitleTypography>
          </TitleTypography>
      <div
        className={
          isNavExpanded ? "navigation-menu expanded" : "navigation-menu"
        }
      >
        <ul>
          <li>
              <Link color="inherit" underline="none" href={"https://www.vitamincoin.org/home"} target="_blank" sx={{cursor: "pointer"}}>
                VITAMINCOIN
              </Link>
              </li>
              <li>
              <Link color="inherit" underline="none" href={"https://vitaminfaucet.com"} target="_blank" sx={{cursor: "pointer"}}>
                FAUCET
              </Link>
              </li>
              <li>
              <Link color="inherit" underline="none" href={"https://swap.vitc.org/"} target="_blank" sx={{cursor: "pointer"}}>
                VITCSWAP
              </Link>
              </li>
              <li>
              {context.account ? (
            <>
              {mobileView ? (
                  <>
                  </>
                ) : (
                  <>
                  <BootstrapTooltip sx={{ [`& .${tooltipClasses.tooltip}`]: { maxWidth: "none" } }} title={context.account} placement="bottom" arrow>
                    <Chip sx={{ color: "white", '& .MuiChip-icon': { color: "white" } }} icon={<AccountCircleIcon />} label={truncateAddress(context.account)} variant="outlined" />
                  </BootstrapTooltip >
                </>
                )}
              <Link color="inherit" underline="none" onClick={handleClickLogout} sx={{cursor: "pointer"}}>
                Logout
              </Link>
            </>
          ) : (
            <>
              <Link color="inherit" underline="none" onClick={handleClickLogin} sx={{cursor: "pointer"}}>
                Login
              </Link>
              <LoginDialog open={loginOpen} setOpen={setLoginOpen} onClose={handleLoginClose}></LoginDialog>
            </>
          )}
          </li>
        </ul>
      </div>
      <IconButton sx={{ ml: 1 }} onClick={() => handleDarkMode()} color="inherit">
        {darkMode ? <Brightness7Icon /> : <Brightness4Icon />}
      </IconButton>
      <NetworkList></NetworkList>
      <Link className="hamburger" onClick={() => {
          setIsNavExpanded(!isNavExpanded);
        }}>
        <DehazeIcon/>
      </Link>
</nav>
      </AppBar>
    </Root >
  )
}