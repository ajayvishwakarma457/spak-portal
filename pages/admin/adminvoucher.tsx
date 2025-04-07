import React, { useState, useEffect } from 'react';
import { TextField, Button, Container, Box, TableContainer, Table, TableHead, TableRow, TableCell, TableBody, Paper, Modal, IconButton, Typography, Dialog, DialogTitle, DialogContent, DialogContentText, DialogActions, FormControl, InputLabel, Select, MenuItem, FormHelperText, Card, CardContent, CardActions } from '@mui/material';
import { useFormik } from 'formik';
import * as Yup from "yup";
import Header from '@/components/admin/header';
import CloseIcon from '@mui/icons-material/Close';
import { formatDateToDDMMYYYY, capitalizeFirstLetter } from '@/utils/common';
import { useSelector } from 'react-redux';
import { RootState } from '@/redux/store';
import { useRouter } from 'next/router';
import getConfig from 'next/config';
const { publicRuntimeConfig } = getConfig();
import axios from 'axios';
import EditIcon from '@mui/icons-material/Edit';
import AddIcon from '@mui/icons-material/Add';
import RemoveIcon from '@mui/icons-material/Remove';
import DeleteIcon from '@mui/icons-material/Delete';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import HourglassEmptyIcon from '@mui/icons-material/HourglassEmpty';
import VisibilityIcon from '@mui/icons-material/Visibility';
import VoucherModelDetail from '@/components/admin/voucher-detail-admin-modal';
import Image from 'next/image';
import useAutoLogout from '@/hooks/useAutoLogout';
import Footer from '@/components/admin/footer';
import AppContext from '@/context/App/AppContext';
import { AxiosResponse } from 'axios';
import KeyboardArrowDownIcon from '@mui/icons-material/KeyboardArrowDown';
import KeyboardArrowUpIcon from '@mui/icons-material/KeyboardArrowUp';



enum ApprovalStatus {
    Pending = "pending",
    Approved = "approved",
    Rejected = "rejected"
}

type FormValues = {
    _id?: string | undefined;
    voucherNo: number;
    personId: string;
    approvalStatus: ApprovalStatus;
    voucherDate: Date | undefined | string;
    voucherAmount: number;
    refId: string;
    firstName?: string;
    lastName?: string;
    imgUrl: string;
};

interface personName {
    value: string;
    label: string;
}


type InputSet = {
    detail: string;
    date: Date | undefined | string;
    amount: number | '';
};


const Index: React.FC = () => {

    const ctx = React.useContext(AppContext);
    const mainDimensionRef = React.useRef<HTMLDivElement>(null);

    const autoLogout = useAutoLogout();

    const [inputList, setInputList] = React.useState<InputSet[]>([]);
    const [validationErrors, setValidationErrors] = React.useState<string[]>([]);

    const [voucherDetailData, setVoucherDetailData] = React.useState<any[]>([]);

    const userData = useSelector((state: RootState) => state.authAdmin);
    const router = useRouter();
    const [expandedRowIndex, setExpandedRowIndex] = useState(null);
    const [selectedIds, setSelectedIds] = useState<any[]>([]);


    if (!userData.token || !(window.localStorage.getItem('jwtToken'))) {
        router.push('/admin/login');
        return false;
    }




    const [voucherList, setVoucherList] = useState<FormValues[]>([]);
    const [toggleModal, setToggleModal] = useState<boolean>(false);
    const [toggleDialogue, setToggleDialogue] = useState<boolean>(false);
    const [toggleApproveDialogue, setToggleApproveDialogue] = useState<boolean>(false);
    const [deleteId, setDeleteId] = useState<string>();
    const [updateId, setUpdateId] = useState<string>();
    const [isEditMode, setIsEditMode] = useState<boolean>(true);
    const [totalAmount, setTotalAmount] = useState<number>(0);

    const [filterStartDate, setFilterStartDate] = useState<Date | null>(new Date());
    const [filterEndDate, setFilterEndDate] = useState<Date | null>(new Date());
    const [filterStatus, setFilterStatus] = useState('');
    const [isModalVisible, setIsModalVisible] = useState(false);

    const handleRowClick = async (index: any, data: any) => {

        if (data.approvalStatus === 'pending') {
            const response = await fetchVoucherDetail(data.refId) as AxiosResponse<any, any>;
            setVoucherDetailData(response.data);

            if (expandedRowIndex === index) {
                setExpandedRowIndex(null);
            } else {
                setExpandedRowIndex(index);
            }
        }
    };

    const handleSelectedItem = async (data: any) => {


        const index = selectedIds.indexOf(data._id);
        if (index === -1) {
            // ID not found in the array, add it
            setSelectedIds([...selectedIds, data._id]);
        } else {
            // ID found in the array, remove it
            const updatedIds = [...selectedIds];
            updatedIds.splice(index, 1);
            setSelectedIds(updatedIds);
        }

        console.log('List', voucherList);
        console.log('selectedIds', selectedIds);

        for (const id of selectedIds) {
            // const foundObj = voucherList.find(item => {
            //     return item._id === id;
            // });
            console.log('id', id);
        }

    };



    // if (!userData.token || !(window.localStorage.getItem('jwtToken'))) {
    //     router.push('/admin/login');
    //     return false;
    // }

    const handleAddInput = () => {
        setInputList([...inputList, { detail: '', date: new Date(), amount: '' }]);
    };



    const handleChange = (index: number, field: keyof InputSet, value: string) => {
        const newList = [...inputList];
        newList[index] = { ...newList[index], [field]: value };
        setInputList(newList);

        let totalAmt = 0;

        newList.forEach((item) => {
            totalAmt = totalAmt + +item.amount;
        });

        setTotalAmount(totalAmt);
    };

    const validateInputs = (): boolean => {
        const errors: string[] = [];
        inputList.forEach((input, index) => {
            if (!input.detail) errors.push(`Detail is required for item ${index + 1}`);
            if (!input.date) errors.push(`Date is required for item ${index + 1}`);
            if (input.amount === '') errors.push(`Amount is required for item ${index + 1}`);
        });

        setValidationErrors(errors);
        return errors.length === 0;
    };

    const handleRemoveInput = (index: number) => {
        const newList = [...inputList];
        newList.splice(index, 1);
        setInputList(newList);
    };

    const fetchData = async () => {

        try {
            if (userData && userData.token) {

                const config = {
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${userData.token || window.localStorage.getItem('jwtToken')}`
                    },

                };

                const response = await axios.post(`${publicRuntimeConfig.API_URL}adminvoucher`, JSON.stringify({ "type": "LIST", "refId": userData.data._id }), config);

                const groupedData = response.data.reduce((acc: any, current: any) => {
                    if (current.approvalStatus === "pending") {
                        acc[current.personId] = acc[current.personId] || [];
                        acc[current.personId].push(current);
                    } else {
                        if (!acc.nonPending) {
                            acc.nonPending = [];
                        }
                        acc.nonPending.push(current);
                    }
                    return acc;
                }, {});

                Object.keys(groupedData).forEach((key) => {
                    groupedData[key].forEach((item: any) => {
                        console.log(item);
                    });
                });

                const finalOutput = [];

                for (const key in groupedData) {


                    if (key !== 'nonPending') {
                        let totalAmount = 0;
                        groupedData[key].forEach((item: any) => {
                            console.log('Key : ', key);
                            console.log(item.voucherAmount);
                            totalAmount = totalAmount + parseInt(item.voucherAmount);
                        });

                        groupedData[key][0].voucherAmount = totalAmount;
                        finalOutput.push(groupedData[key][0]);
                    } else {
                        finalOutput.push(...groupedData[key]);
                        console.log('Pending');
                    }
                }


                if (response.status === 200) {
                    // setVoucherList(response.data)

                    let sortedData = finalOutput.sort((a, b) => {
                        // Custom sorting logic
                        if (a.approvalStatus === 'pending' && b.approvalStatus !== 'pending') {
                            return -1; // 'pending' comes before other statuses
                        } else if (a.approvalStatus !== 'pending' && b.approvalStatus === 'pending') {
                            return 1; // Other statuses come after 'pending'
                        } else {
                            return 0; // No change in order
                        }
                    });

                    setVoucherList(sortedData);
                }

            } else {
                console.error('No token available');
            }
        } catch (error) {
            console.error('Error fetching data:', error);
        }

    };

    const formik = useFormik<FormValues>({
        initialValues: {
            voucherNo: 0,
            personId: '',
            approvalStatus: ApprovalStatus.Pending,
            voucherDate: new Date(),
            voucherAmount: 0,
            imgUrl: '',
            refId: ''
        },
        validationSchema: Yup.object({
            voucherNo: Yup.number(),
            personId: Yup.string(),
            approvalStatus: Yup.string(),
            voucherDate: Yup.date().required('Required'),
            voucherAmount: Yup.number()
        }),
        onSubmit: (values) => {

            if (isEditMode) {

                setInputList([...inputList]);

                const editVoucher = async (obj: FormValues) => {
                    try {
                        if (userData && userData.token) {

                            const isValid = validateInputs();

                            if (!isValid) {
                                alert('Please fill the detail');
                                return;
                            }

                            const config = {
                                headers: {
                                    'Content-Type': 'application/json',
                                    'Authorization': `Bearer ${userData.token || window.localStorage.getItem('jwtToken')}`
                                },

                            };

                            const objData = {
                                type: "UPDATE",
                                id: updateId,
                                voucherData: inputList,
                                voucherAmount: totalAmount
                            };

                            const response = await axios.post(`${publicRuntimeConfig.API_URL}adminvoucher`, JSON.stringify(objData), config);
                            console.log(response);

                            if (response.status === 200) {
                                console.log('');
                                setInputList([]);
                                setToggleModal(false);
                            }

                        } else {
                            console.error('No token available');
                        }

                    } catch (error) {
                        console.error('Error creating data:', error);
                    }
                };

                editVoucher(values);

            } else {

                setInputList([]);

                const createVoucher = async (obj: FormValues) => {
                    try {
                        if (userData && userData.token) {

                            const isValid = validateInputs();

                            setInputList([...inputList.slice(1, 1), { detail: '', date: '', amount: '' }]);

                            if (!isValid) {
                                alert('Please fill the detail');
                                return;
                            }

                            const config = {
                                headers: {
                                    'Content-Type': 'application/json',
                                    'Authorization': `Bearer ${userData.token || window.localStorage.getItem('jwtToken')}`
                                },

                            };

                            const objData = {
                                type: "CREATE",
                                voucherNo: obj.voucherNo,
                                personId: userData.data._id,
                                approvalStatus: ApprovalStatus.Pending,
                                voucherDate: obj.voucherDate,
                                voucherAmount: totalAmount,
                                voucherData: inputList,
                                refId: userData.data._id
                            };

                            const response = await axios.post(`${publicRuntimeConfig.API_URL}adminvoucher`, JSON.stringify(objData), config);
                            if (response.status === 200) {
                                setIsEditMode(false);
                                fetchData();
                                setToggleModal(false);
                            }

                        } else {
                            console.error('No token available');
                        }

                    } catch (error) {
                        console.error('Error creating data:', error);
                    }
                };

                createVoucher(values);
            }

            //setToggleModal(false);
        }
    });


    useEffect(() => {

        fetchData();

        setTimeout(() => {
            ctx.onMainDimension({ height: mainDimensionRef.current?.clientHeight });
        }, 1000);

        return () => console.log('Unbind UseEffect');

    }, [toggleModal, toggleDialogue]);

    const toggleModalHandler = () => {
        formik.resetForm();
        setToggleModal(!toggleModal);

        setInputList([]);

        if (toggleModal) {
            setInputList([]);
        } else {
            setInputList([...inputList, { detail: '', date: '', amount: '' }]);
        }
    };

    const confirmToDelete = async () => {

        try {
            if (userData && userData.token) {
                const config = {
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${userData.token || window.localStorage.getItem('jwtToken')}`
                    },

                };

                const objData = {
                    id: deleteId,
                    type: "DELETE"
                };

                const response = await axios.post(`${publicRuntimeConfig.API_URL}adminvoucher`, JSON.stringify(objData), config);
                console.log(response);

                if (response.status === 200) {
                    setToggleDialogue(false);
                }

            } else {
                console.error('No token available');
            }

        } catch (error) {
            console.error('Error creating data:', error);
        }

    };

    const openCreateModalHandler = () => {
        toggleModalHandler();
        setIsEditMode(false);
    };

    const filterResult = async () => {

        console.log('filterStatus', filterStatus);
        console.log('filterStartDate', filterStartDate);
        console.log('filterEndDate', filterEndDate);

        setVoucherList([]);

        const taskConfig = {
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${userData.token || window.localStorage.getItem('jwtToken')}`
            },

        };

        const objData = {
            type: "LIST",
            status: filterStatus,
            filterStartDate: filterStartDate,
            filterEndDate: filterEndDate,
            refId: userData.data._id
        };

        const response = await axios.post(`${publicRuntimeConfig.API_URL}adminvoucher`, JSON.stringify(objData), taskConfig);
        console.log(response.data);

        if (response.status === 200) {
            setVoucherList(response.data);
        }

    };

    const resetFilter = () => {
        fetchData();
    };

    const fetchVoucherDetail = async (refId: string) => {

        let resp;

        try {
            if (userData && userData.token) {

                const config = {
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${userData.token || window.localStorage.getItem('jwtToken')}`
                    },
                };

                const response = await axios.post(`${publicRuntimeConfig.API_URL}voucher`, JSON.stringify({ type: "ADMIN-DETAIL", refId: refId }), config);
                resp = response;

            } else {
                console.error('No token available');
                resp = 'No token available';
            }
        } catch (error) {
            console.error('Error fetching data:', error);
            resp = 'Error fetching data:', error;
        }

        return resp;
    };

    const approveHandler = async () => {

        if (selectedIds.length > 0) {
            try {
                if (userData && userData.token) {
                    const config = {
                        headers: {
                            'Content-Type': 'application/json',
                            'Authorization': `Bearer ${userData.token || window.localStorage.getItem('jwtToken')}`
                        },
                    };

                    for (const id of selectedIds) {
                        const objData = {
                            id: id,
                            type: "UPDATE",
                            approvalStatus: 'approved'
                        };

                        const response = await axios.post(`${publicRuntimeConfig.API_URL}adminvoucher`, JSON.stringify(objData), config);

                        if (response.status === 200) {
                            const notificationObj = {
                                type: "VOUCHERCREATE",
                                voucherId: objData.id,
                                status: 'approved',
                                actionDate: new Date()
                            };

                            const notificationResp = await axios.post(`${publicRuntimeConfig.API_URL}notification/voucher`, JSON.stringify(notificationObj), config);

                            if (notificationResp.status === 200) {
                                fetchData();
                            }
                        }
                    }
                } else {
                    console.error('No token available');
                }
            } catch (error) {
                console.error('Error creating data:', error);
            }
        }

    };

    const rejectHandler = async () => {

        if (selectedIds.length > 0) {
            try {
                if (userData && userData.token) {
                    const config = {
                        headers: {
                            'Content-Type': 'application/json',
                            'Authorization': `Bearer ${userData.token || window.localStorage.getItem('jwtToken')}`
                        },
                    };

                    for (const id of selectedIds) {
                        const objData = {
                            id: id,
                            type: "UPDATE",
                            approvalStatus: 'rejected'
                        };

                        const response = await axios.post(`${publicRuntimeConfig.API_URL}adminvoucher`, JSON.stringify(objData), config);

                        if (response.status === 200) {
                            const notificationObj = {
                                type: "VOUCHERCREATE",
                                voucherId: objData.id,
                                status: 'rejected',
                                actionDate: new Date()
                            };

                            const notificationResp = await axios.post(`${publicRuntimeConfig.API_URL}notification/voucher`, JSON.stringify(notificationObj), config);

                            if (notificationResp.status === 200) {
                                fetchData();
                            }
                        }
                    }

                } else {
                    console.error('No token available');
                }

            } catch (error) {
                console.error('Error rejecting data:', error);
            }
        }



    };

    return (
        <>
            <Header />
            <Container component="main" ref={mainDimensionRef}>

                {/* filter */}

                <div>
                    <div className='create-data-wrapper-heading voucher-header'>
                        <h1>Voucher</h1>
                    </div>
                    <div className='create-data-wrapper'>

                        <FormControl fullWidth>
                            <Box display="flex" justifyContent="space-between">

                                <Box flex={1} marginRight={2}>
                                    <FormControl fullWidth>
                                        <InputLabel id="demo-simple-select-label">Status</InputLabel>
                                        <Select
                                            label="Status"
                                            variant="outlined"
                                            value={filterStatus}
                                            onChange={(e) => setFilterStatus(e.target.value)}>
                                            <MenuItem value={ApprovalStatus.Pending}><b>{capitalizeFirstLetter(ApprovalStatus.Pending)}</b></MenuItem>
                                            <MenuItem value={ApprovalStatus.Approved}>{capitalizeFirstLetter(ApprovalStatus.Approved)}</MenuItem>
                                            <MenuItem value={ApprovalStatus.Rejected}>{capitalizeFirstLetter(ApprovalStatus.Rejected)}</MenuItem>
                                        </Select>
                                    </FormControl>
                                </Box>

                                <Box flex={1} marginRight={2} marginLeft={1}>
                                    <TextField
                                        fullWidth
                                        type='date'
                                        label="Start Date"
                                        variant="outlined"
                                        value={filterStartDate instanceof Date ? filterStartDate.toISOString().split('T')[0] : ''}
                                        onChange={(e) => setFilterStartDate(e.target.value ? new Date(e.target.value) : null)}
                                    />
                                </Box>


                                <Box flex={1} marginRight={2}>
                                    <TextField
                                        fullWidth
                                        type='date'
                                        label="End Date"
                                        variant="outlined"
                                        value={filterEndDate instanceof Date ? filterEndDate.toISOString().split('T')[0] : ''}
                                        onChange={(e) => setFilterEndDate(e.target.value ? new Date(e.target.value) : null)}
                                    />
                                </Box>

                                <Box flex={1} marginRight={2}>
                                    <Button type="submit" variant="contained" onClick={filterResult} size='large' fullWidth style={{ padding: '15px 0' }}>Search</Button>
                                </Box>
                                <Box flex={1}>
                                    <Button type="submit" variant="contained" onClick={resetFilter} size='large' color='inherit' fullWidth style={{ padding: '15px 0' }}>Reset</Button>
                                </Box>
                            </Box>

                        </FormControl>
                    </div>
                </div>

                {/* filter */}


                <TableContainer component={Paper}>
                    <Table sx={{ minWidth: 800 }} aria-label="simple table">
                        <TableHead style={{ backgroundColor: 'lightgrey' }}>
                            <TableRow>
                                <TableCell>Person</TableCell>
                                <TableCell>Date</TableCell>
                                <TableCell>Total Amount</TableCell>
                                <TableCell>Approval Status</TableCell>
                                <TableCell>Expand</TableCell>
                            </TableRow>
                        </TableHead>

                        <TableBody>
                            {Array.isArray(voucherList) && voucherList.map((row, index) => (
                                <React.Fragment key={index}>
                                    <TableRow sx={{ '&:last-child td, &:last-child th': { border: 0 } }} style={{ cursor: 'pointer' }} onClick={() => handleRowClick(index, row)}>
                                        <TableCell component="th" scope="row">{row.firstName + ' ' + row.lastName}</TableCell>
                                        <TableCell component="th" scope="row">{formatDateToDDMMYYYY(row.voucherDate as string)}</TableCell>
                                        <TableCell component="th" scope="row">{row.voucherAmount}</TableCell>
                                        <TableCell component="th" scope="row">
                                            {row.approvalStatus?.toLowerCase() === 'pending' && <b className='pending'>{capitalizeFirstLetter(ApprovalStatus.Pending)}</b>}
                                            {row.approvalStatus?.toLowerCase() === 'approved' && <b className='approved'>{capitalizeFirstLetter(ApprovalStatus.Approved)}</b>}
                                            {row.approvalStatus?.toLowerCase() === 'rejected' && <b className='rejected'>{capitalizeFirstLetter(ApprovalStatus.Rejected)}</b>}
                                        </TableCell>
                                        <TableCell component="th" scope="row">
                                            {
                                                row.approvalStatus.toLowerCase() === 'pending' && (expandedRowIndex === index ? <KeyboardArrowUpIcon /> : <KeyboardArrowDownIcon />)
                                            }
                                        </TableCell>
                                    </TableRow>


                                    {expandedRowIndex === index && (
                                        Array.isArray(voucherDetailData) && voucherDetailData.map((detailData, ind) => (
                                            <TableRow key={ind} className='admin-voucher-collapsible-wrapper-main-wrapper'>
                                                <TableCell colSpan={5}>
                                                    <div className={`admin-voucher-collapsible-wrapper ${selectedIds.includes(detailData._id) ? 'selected' : ''}`} onClick={() => handleSelectedItem(detailData)}>
                                                        <Card>
                                                            <CardContent>
                                                                <div className='admin-voucher-header-wrapper'>
                                                                    <Typography gutterBottom variant="body1" component="div">
                                                                        Voucher No : <b>{detailData.voucherNo}</b>  Voucher Date: <b>{formatDateToDDMMYYYY(detailData.voucherDate as string)}</b>
                                                                    </Typography>
                                                                    <Typography gutterBottom variant="body1" component="div">
                                                                        Total : <b>{detailData.voucherAmount}</b>
                                                                    </Typography>
                                                                </div>


                                                                <Table aria-label="simple table">
                                                                    <TableHead style={{ backgroundColor: 'lightgrey' }}>
                                                                        <TableRow>
                                                                            <TableCell>Item</TableCell>
                                                                            <TableCell>Date</TableCell>
                                                                            <TableCell>Amount</TableCell>
                                                                        </TableRow>
                                                                    </TableHead>

                                                                    <TableBody>
                                                                        {Array.isArray(detailData.voucherData) && detailData.voucherData.map((itemData: any, index: any) => (
                                                                            <TableRow key={index} sx={{ '&:last-child td, &:last-child th': { border: 0 } }} style={{ cursor: 'pointer' }}>
                                                                                <TableCell component="th" scope="row">{itemData.detail}</TableCell>
                                                                                <TableCell component="th" scope="row">{formatDateToDDMMYYYY(itemData.date as string)}</TableCell>
                                                                                <TableCell component="th" scope="row">{itemData.amount}</TableCell>
                                                                            </TableRow>
                                                                        ))}
                                                                    </TableBody>
                                                                </Table>

                                                            </CardContent>
                                                        </Card>

                                                        <CheckCircleIcon className='done-icon' />
                                                    </div>
                                                </TableCell>
                                            </TableRow>
                                        ))
                                    )
                                    }

                                    {expandedRowIndex === index &&
                                        <TableRow sx={{ '&:last-child td, &:last-child th': { border: 0 } }} style={{ cursor: 'pointer' }} onClick={() => handleRowClick(index, row)}>
                                            <TableCell colSpan={5}>
                                                <div className='admin-voucher-collapsible-btn-wrapper'>
                                                    <Button variant="contained" color="inherit" className={'pointer admin-approve-reject-btn'} size={'small'} onClick={(event) => { event.stopPropagation(); rejectHandler(); }}>Reject</Button>
                                                    <Button variant="contained" color="primary" className={'pointer admin-approve-reject-btn'} size={'small'} onClick={(event) => { event.stopPropagation(); approveHandler(); }}>Approve</Button>
                                                </div>
                                            </TableCell>
                                        </TableRow>}



                                </React.Fragment>
                            ))}

                            {voucherList.length < 1 &&
                                <TableRow sx={{ '&:last-child td, &:last-child th': { border: 0 } }}>
                                    <TableCell component="th" scope="row" colSpan={6}>
                                        <Typography variant="body1" align='center'>No Voucher</Typography>
                                    </TableCell>
                                </TableRow>
                            }

                        </TableBody>
                    </Table>
                </TableContainer>

                <Dialog
                    open={toggleDialogue}
                    onClose={() => setToggleDialogue(false)}
                    aria-labelledby="alert-dialog-title"
                    aria-describedby="alert-dialog-description">
                    <DialogTitle id="alert-dialog-title">{"Confirm Delete"}</DialogTitle>
                    <DialogContent>
                        <DialogContentText id="alert-dialog-description">
                            Are you sure you want to delete this Voucher?
                        </DialogContentText>
                    </DialogContent>
                    <DialogActions>
                        <Button onClick={() => setToggleDialogue(false)} color="primary">Cancel</Button>
                        <Button onClick={confirmToDelete} color="secondary" autoFocus>Delete</Button>
                    </DialogActions>
                </Dialog>

            </Container >



            <Footer />



            {isModalVisible && <VoucherModelDetail rowData={voucherDetailData} onClick={() => setIsModalVisible(!isModalVisible)} isVisible={isModalVisible} />}


        </>
    )
};

export default Index;