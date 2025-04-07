import React, { useState, useEffect } from 'react';
import { Modal, Card, CardContent, CardActions, Button, Typography, CardMedia, CardHeader, Avatar, TableContainer, Table, TableHead, TableRow, TableCell, TableBody, Paper } from '@mui/material';
import VisibilityIcon from '@mui/icons-material/Visibility';
import Status from '@/components/admin/status';
import CloseIcon from '@mui/icons-material/Close';
import { getDayText, formatDateToDDMMYYYY, getTotalVoucherAmount, capitalizeFirstLetter, getAdminTotalVoucherAmount } from '@/utils/common';
import Image from 'next/image';
import { useSelector } from 'react-redux';
import { RootState } from '@/redux/store';
import getConfig from 'next/config';
const { publicRuntimeConfig } = getConfig();
import axios from 'axios';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import CancelIcon from '@mui/icons-material/Cancel';

interface componentProps {
    rowData: any,
    userRawData?: any;
    onClick: () => void,
    isVisible: boolean
}

const Index: React.FC<componentProps> = ({ rowData, onClick, isVisible }) => {


    const [rowDetailData, setRowDetailData] = useState(rowData);
    const [open, setOpen] = useState(isVisible);
    const userData = useSelector((state: RootState) => state.authAdmin);

    const handleOpen = () => {
        setOpen(true);
        onClick();
    };

    const handleClose = () => {
        setOpen(false);
        onClick();
    };

    const modalStyle = {
        position: 'absolute',
        top: '50%',
        left: '50%',
        transform: 'translate(-50%, -50%)',
        width: 600,
        bgcolor: 'background.paper',
        boxShadow: 24,
        p: 4,
    };

    useEffect(() => {

        console.log('rowDetailData', rowDetailData);

        return () => console.log('');
    }, [rowData]);



    return (
        <>
            <span onClick={handleOpen} ><VisibilityIcon color='inherit' /></span>


            <Modal
                open={open}
                onClose={handleClose}
                aria-labelledby="modal-modal-title"
                aria-describedby="modal-modal-description">

                <Card sx={modalStyle}>
                    <div className='custom-task-detail-wrapper'>
                        <div className='voucher-detail-logo-no'>
                            {rowData.imgUrl ?
                                <Image className='pointer round-img' src={rowData.imgUrl} alt="Description of the image" width={'50'} height={'50'} /> :
                                <Image className='pointer round-img' src={require('../../public/assets/img/b-logo.jpg')} alt="Description of the image" width={'50'} height={'50'} />}
                            <CardHeader title={'User Name'} />
                        </div>
                        <Button size="small" color='inherit' onClick={handleClose}><CloseIcon /></Button>
                    </div>

                    <CardContent>


                        <div className='admin-voucher-detail-modal-wrapper'>
                            {
                                rowDetailData.map((rowData: any, index: any) => (
                                    <div key={index}>
                                        <TableContainer component={Paper}>
                                            <Table sx={{ minWidth: 400 }} aria-label="simple table">
                                                <TableHead style={{ backgroundColor: 'lightgrey' }}>
                                                    <TableRow>
                                                        <TableCell>Detail</TableCell>
                                                        <TableCell>Date</TableCell>
                                                        <TableCell>Amount</TableCell>
                                                    </TableRow>
                                                </TableHead>

                                                <TableBody>

                                                    {Array.isArray(rowData.voucherData) && rowData.voucherData.map((row: any, ind: any) => (
                                                        <TableRow key={ind} sx={{ '&:last-child td, &:last-child th': { border: 0 } }}>
                                                            <TableCell component="th" scope="row">{row.detail}</TableCell>
                                                            <TableCell component="th" scope="row">{formatDateToDDMMYYYY(row.date as string)}</TableCell>
                                                            <TableCell component="th" scope="row">{row.amount}</TableCell>
                                                        </TableRow>
                                                    ))}

                                                </TableBody>
                                            </Table>
                                        </TableContainer>
                                        <div className='admin-voucher-detail-bottom-space'></div>

                                        {
                                            userData.data.designation === 'admin' &&
                                            <>
                                                <div className='voucher-detail-approve-reject-wrapper'>
                                                    <Button variant="contained" color="inherit" className={'pointer admin-approve-reject-btn'} sx={{ mr: 2 }} size={'small'}>Reject</Button>
                                                    <Button variant="contained" color="primary" className={'pointer admin-approve-reject-btn'} size={'small'}>Approve</Button>
                                                </div>
                                                {/* <hr /> */}
                                            </>
                                        }

                                    </div>
                                ))
                            }
                        </div>

                        {/* <TableContainer component={Paper} key={index}>
                            <Table sx={{ minWidth: 400 }} aria-label="simple table">
                                <TableHead style={{ backgroundColor: 'lightgrey' }}>
                                    <TableRow>
                                        <TableCell>Detail</TableCell>
                                        <TableCell>Date</TableCell>
                                        <TableCell>Amount</TableCell>
                                    </TableRow>
                                </TableHead>

                                <TableBody>

                                    {Array.isArray(rowData.voucherData) && rowData.voucherData.map((row: any, index: any) => (
                                        <TableRow key={index} sx={{ '&:last-child td, &:last-child th': { border: 0 } }}>
                                            <TableCell component="th" scope="row">{row.detail}</TableCell>
                                            <TableCell component="th" scope="row">{formatDateToDDMMYYYY(row.date as string)}</TableCell>
                                            <TableCell component="th" scope="row">{row.amount}</TableCell>
                                        </TableRow>
                                    ))}

                                </TableBody>
                            </Table>
                        </TableContainer> */}

                        <div className='total-amount'>
                            <div className='voucher-detail-status'>
                                <div>
                                    {/* <b>Approval Status : </b> */}
                                    {rowDetailData.approvalStatus?.toLowerCase() === 'pending' && <b className='pending'>{capitalizeFirstLetter(rowDetailData.approvalStatus)}</b>}
                                    {rowDetailData.approvalStatus?.toLowerCase() === 'approved' && <b className='approved'>{capitalizeFirstLetter(rowDetailData.approvalStatus)}</b>}
                                    {rowDetailData.approvalStatus?.toLowerCase() === 'rejected' && <b className='rejected'>{capitalizeFirstLetter(rowDetailData.approvalStatus)}</b>}
                                </div>
                                <div>
                                    <b>Total Amount : </b> {getAdminTotalVoucherAmount(rowDetailData)}
                                </div>
                            </div>
                        </div>

                    </CardContent>
                </Card>

            </Modal>
        </>
    );
}

export default React.memo(Index);