import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import OpenInNewIcon from '@mui/icons-material/OpenInNew';
import { Accordion, AccordionDetails, AccordionSummary, Box, Button, Grid, Link, Paper, Skeleton, styled, Typography } from "@mui/material";
import BigNumber from 'bignumber.js';
import React, { useEffect, useState } from "react";
import { getNetworkManager } from '../../../../common/network';
import { getPoolService } from '../../../../services/pool.service';
import { getEmitter } from '../../../../util/emitter.util';
import { getLogger } from "../../../../util/logger";
import { SnackbarUtil } from '../../../../util/snackbar.util';
import { Pool, PoolDialogState, PoolDialogType } from "../../../../util/types";
import { ViteUtil } from "../../../../util/vite.util";
import { ClickOnceButton } from '../../../common/components/click-once-button';
import { PoolCountdown } from "../countdown";
import { PoolDialog } from "../dialog";
import { Rewards } from '../rewards';
import { TimeLock } from '../timelock';
import { Tokens } from "../tokens";
import { TotalEarnedRewards } from '../totalearnedrewards';

const logger = getLogger()

const TransparentPaper = styled(Paper)(
  ({ theme }) => ({
    padding: theme.spacing(2),
    paddingTop: theme.spacing(1),
    backgroundColor: "transparent"
  }));

interface Props {
  account?: Maybe<string>
  pool?: Maybe<Pool>
}

export const PoolListItem: React.FC<Props> = (props: Props) => {
  const [dialogState, setDialogState] = useState<PoolDialogState>({
    type: PoolDialogType.DEPOSIT,
    open: false
  });
  const [canStake, setCanStake] = useState<boolean>(false);
  const [canClaim, setCanClaim] = useState<boolean>(false);
  const [canWithdraw, setCanWithdraw] = useState<boolean>(false);
  const emitter = getEmitter();
  const poolService = getPoolService();
  const networkManager = getNetworkManager();
  const [expanded, setExpanded] = useState<boolean>(() => {
    if(!props.pool)return true
    return localStorage.getItem(
      `${networkManager.getNetwork()?.contractAddress}.${props.pool?.id}.expanded`
    ) !== "false"
  })

  useEffect(() => {
    let height = new BigNumber(0)
    const refresh = () => {
      if(height.isEqualTo(networkManager.networkHeight))return
      height = networkManager.networkHeight
      if (props.pool) {
        logger.info(`Pool loaded: ${props.pool?.id} ${props.pool.stakingToken.name} => ${props.pool.rewardToken.name}`)();
        let timelockOK = true;
        const hasStarted = props.pool.startBlock.isLessThanOrEqualTo(height)
        const hasNotEnded = props.pool.endBlock.isGreaterThanOrEqualTo(height)
        if(props.pool.timelock.isGreaterThan(0) && props.pool.userInfo && hasStarted && hasNotEnded){
          // timelock + depositBlock < networkHeight  
          timelockOK = props.pool.userInfo.depositBlock.plus(props.pool.timelock).isLessThanOrEqualTo(height);
        }
        setCanWithdraw(!!props.account && (props.pool.userInfo?.stakingBalance.gt(0) ?? false) && timelockOK);
      } else {
        setCanWithdraw(false);
      }
    }
    refresh()
    const interval = setInterval(refresh, 500)
    return () => {
      clearInterval(interval)
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [props.pool, props.account]);

  useEffect(() => {
    let interval = setInterval(() => {
      setCanStake(!!props.pool && !!props.account);
    }, 500);
    return () => {
      clearInterval(interval);
    }
  }, [props.pool, props.account, networkManager]);

  const showApr = (): Maybe<string> => {
    if (!props.pool || !props.pool.apr) {
      return "0";
    }
    return props.pool.apr.toFormat(2);
  }

  const showTotalStaked = (): string => {
    if (!props.pool) {
      return "0";
    }
    return ViteUtil.formatBigNumber(props.pool.totalStaked, props.pool.stakingToken.decimals, 2);
  }

  const showStaked = (decimals: number): string => {
    if (!props.pool?.userInfo) {
      return "0";
    }
    return ViteUtil.formatBigNumber(props.pool.userInfo.stakingBalance, props.pool.stakingToken.decimals, decimals);
  }

  const handleConnectWallet = () => {
    emitter.emitConnectWalletDialog(true);
  }

  const handleClickDeposit = () => {
    setDialogState({
      ...dialogState,
      type: PoolDialogType.DEPOSIT,
      open: true
    })
  }

  const handleClickWithdraw = () => {
    setDialogState({
      ...dialogState,
      type: PoolDialogType.WITHDRAW,
      open: true
    })
  }

  const handleClickClaimAsync = async () => {
    try {
      if (props.pool) {
        await poolService.withdrawAsync(props.pool.id, "0");
      }
    } catch (error) {
      let e = error as any
      if(e.message === "undefined"){
        e.message = e.networkError
      }
      SnackbarUtil.enqueueError(error);
    }
  }

  return (
    <>
      <Accordion expanded={expanded} onChange={(ev, expanded) => {
        if(!props.pool)return
        localStorage.setItem(
          `${networkManager.getNetwork()?.contractAddress}.${props.pool.id}.expanded`,
          String(expanded)
        )
        setExpanded(expanded)
      }}>
        <AccordionSummary sx={{ backgroundColor: "rgba(217, 217, 217, 0.1)" }} expandIcon={<ExpandMoreIcon />}>        
          <Grid container justifyContent="center" alignItems="center" spacing={2} color="text.secondary" sx={{minHeight: "395px"}}>
            <Grid item xs={12} md={12}>
              <Tokens loading={!props.pool} pool={props.pool}></Tokens>
            </Grid>
            <Grid item xs={12} md={12}>
                <PoolCountdown pool={props.pool} />
            </Grid>

              <Grid item container justifyContent="space-evenly" direction="row">
                <Grid item xs={12} sm={12} md={7}>
                  {!props.pool ? (
                    <>
                      <Skeleton animation="wave" height={25} width="90px" />
                      <Skeleton animation="wave" height={25} width="70px" />
                    </>
                  ) : (
                    <>
                      <Typography variant="body2" color="text.secondary">
                        Total {props.pool?.rewardToken.originalSymbol} earned
                      </Typography>
                      <Typography variant="subtitle1">
                        <TotalEarnedRewards pool={props.pool} decimals={0}></TotalEarnedRewards>
                      </Typography>
                    </>
                  )}
                </Grid>
                <Grid item xs={12} sm={12} md={5} sx={{textAlign: 'right'}}>
                  <Typography variant="body2" color="text.secondary">
                    APR
                  </Typography>
                  {!props.pool ? (
                    <Skeleton animation="wave" height={25} width="60px" />
                  ) : (
                    <Typography variant="subtitle1">
                      {props.pool.apr ? (
                        <>
                          {showApr()}%
                        </>
                      ) : (
                        <>
                          -
                        </>
                      )}
                    </Typography>
                  )}
                </Grid>
                </Grid>

                <Grid item container justifyContent="space-evenly" direction="row">
                <Grid item xs={12} sm={12} md={12} mt={2}>
                  <Typography variant="body2" color="text.secondary">
                    Total staked
                  </Typography>
                  {!props.pool ? (
                    <Skeleton animation="wave" height={25} width="120px" />
                  ) : (
                    <Typography variant="subtitle1">
                      {showTotalStaked()}
                    </Typography>
                  )}
                </Grid>
                </Grid>
                <Grid item container justifyContent="space-evenly" direction="row">
                {props.pool?.timelock.isGreaterThan(0) ? <Grid item xs={12} sm={12} md={12}>
                  <Typography variant="subtitle1" sx={{ color: '#ff4c4c', fontWeight: 700}}>
                  This is a LOCKED pool, timelock 
                  </Typography>
                  <Typography variant="subtitle1" sx={{ color: '#ff4c4c'}}>
                    <TimeLock pool={props.pool} />
                  </Typography>
                </Grid> : null}  
              </Grid>


          </Grid>
        </AccordionSummary>
        <AccordionDetails sx={{ backgroundColor: "rgba(217, 217, 217, 0.3)", pt: 2 }}>
          <Grid container justifyContent="center" alignItems="center" spacing={2}>
            <Grid item xs container alignItems="center">
              <Grid item container justifyContent="space-evenly" direction="row" spacing={2}>
                <Grid item xs={6} md={6} container justifyContent="center" alignItems="center">
                  <Link color="secondary" underline="none" href={props.pool?.stakingToken.url ?? "#"} target="_blank" sx={{ cursor: "pointer", display: "flex", alignItems: "center" }}>
                    {props.pool?.stakingToken.originalSymbol}&nbsp;<OpenInNewIcon fontSize="small"></OpenInNewIcon>
                  </Link>
                </Grid>
                <Grid item xs={6} md={6} container justifyContent="center" alignItems="center">
                  <Link color="secondary" underline="none" href={props.pool?.rewardToken.url ?? "#"} target="_blank" sx={{ cursor: "pointer", display: "flex", alignItems: "center" }}>
                    {props.pool?.rewardToken.originalSymbol}&nbsp;<OpenInNewIcon fontSize="small"></OpenInNewIcon>
                  </Link>
                </Grid>
                <Grid item xs={12} md={12} zeroMinWidth>
                  <TransparentPaper variant="outlined">
                    <Typography variant="body2" color="text.secondary">
                      {props.pool?.rewardToken.originalSymbol} earned
                    </Typography>
                    <Box sx={{ display: "flex", alignItems: "center" }}>
                      {!props.pool ? (
                        <Skeleton animation="wave" height={30} width="100%" />
                      ) : (
                        <Typography sx={{ width: "100%" }} noWrap>
                          <Rewards pool={props.pool} decimals={18} account={props.account} setCanClaim={setCanClaim}></Rewards>
                        </Typography>
                      )}
                      <Box sx={{ ml: 2 }} >
                        <ClickOnceButton variant="contained" size="large" callbackFn={handleClickClaimAsync} disabled={!canClaim}>
                          Claim
                        </ClickOnceButton>
                      </Box>
                    </Box>
                  </TransparentPaper>
                </Grid>
                {!props.account ? (
                  <Grid item xs={12} md={12}>
                    <TransparentPaper variant="outlined">
                      <Typography variant="body2" color="text.secondary">
                        Start staking
                      </Typography>
                      <Button variant="contained" size="large" fullWidth disabled={!props.pool} onClick={handleConnectWallet}>Connect wallet</Button>
                    </TransparentPaper>
                  </Grid>
                ) : (
                  <>
                    <Grid item xs={12} md={12} zeroMinWidth>
                      <TransparentPaper variant="outlined">
                        <Typography variant="body2" color="text.secondary">
                          Staked
                        </Typography>
                        <Box sx={{ display: "flex", alignItems: "center" }}>
                          {!props.pool ? (
                            <Skeleton animation="wave" height={30} width="100%" />
                          ) : (
                            <Typography sx={{ width: "100%" }} noWrap>
                              {showStaked(18)}
                            </Typography>
                          )}
                          <Button variant="contained" size="large" sx={{ ml: 2 }} onClick={handleClickWithdraw} disabled={!canWithdraw}>
                            Withdraw
                          </Button>
                        </Box>
                      </TransparentPaper>
                    </Grid>
                    <Grid item xs={12} md={12} sx={{ display: "flex", alignItems: "center" }}>
                      <Button variant="contained" size="large" fullWidth onClick={handleClickDeposit} disabled={!canStake}>
                        Stake
                      </Button>
                    </Grid>
                  </>
                )}
              </Grid>
            </Grid>
          </Grid>
        </AccordionDetails>
      </Accordion>
      {props.pool && (
        <PoolDialog pool={props.pool} state={dialogState} setState={setDialogState}></PoolDialog>
      )}
    </>
  );
}