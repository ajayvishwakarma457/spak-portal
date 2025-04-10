import React, { useState, useEffect } from 'react';
import { TextField, Button, Container, Box, TableContainer, Table, TableHead, TableRow, TableCell, TableBody, Paper, Modal, IconButton, Typography, Dialog, DialogTitle, DialogContent, DialogContentText, DialogActions, FormControl, InputLabel, Select, MenuItem, FormHelperText } from '@mui/material';
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
    const [expandedRowIndex, setExpandedRowIndex] = useState(null);

    const handleRowClick = (index: any, data: any) => {
        console.log('row', data);

        if (expandedRowIndex === index) {
            // If already expanded, collapse
            setExpandedRowIndex(null);
        } else {
            // Expand the clicked row
            setExpandedRowIndex(index);
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
                    setVoucherList(finalOutput)
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

    const editHandler = async (id: string | undefined) => {

        setIsEditMode(true);
        toggleModalHandler();


        try {
            if (userData && userData.token) {

                const config = {
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${userData.token || window.localStorage.getItem('jwtToken')} `
                    },

                };

                const objData = {
                    id: id,
                    type: "DETAIL"
                };

                const response = await axios.post(`${publicRuntimeConfig.API_URL}adminvoucher`, JSON.stringify(objData), config);

                console.log(response);
                setUpdateId(id);

                if (response.status === 200) {
                    if (response.data.voucherData.length > 0) {
                        response.data.voucherData.forEach((item: InputSet, indx: any) => {
                            inputList.push({ detail: item.detail, amount: item.amount, date: item.date })
                        });

                        let totalAmt = 0;

                        inputList.forEach((item) => {
                            totalAmt = totalAmt + +item.amount;
                        });

                        setTotalAmount(totalAmt);
                        setInputList([...inputList])
                    }
                }

            } else {
                console.error('No token available');
            }
        } catch (error) {
            console.error('Error fetching data:', error);
        }

    };

    const deleteHandler = async (id: string | undefined) => {
        setToggleDialogue(true);
        setDeleteId(id);
    }

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


    const modalStyle = {
        position: 'absolute',
        top: '50%',
        left: '50%',
        transform: 'translate(-50%, -50%)',
        width: 600,
        bgcolor: 'background.paper',
        border: '2px solid #000',
        boxShadow: 24,
        p: 4,
    };

    const openCreateModalHandler = () => {
        toggleModalHandler();
        setIsEditMode(false);
    };

    const getDetailHandler = async (voucherId: string | undefined) => {

        const config = {
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${userData.token || window.localStorage.getItem('jwtToken')} `
            },

        };

        const objData = {
            id: voucherId,
            type: "DETAIL"
        };

        const response = await axios.post(`${publicRuntimeConfig.API_URL}adminvoucher`, JSON.stringify(objData), config);

        if (response.status === 200) {
            console.log(response);
        }

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

    const getVoucherDetail = async (data: any) => {
        const response = await fetchVoucherDetail(data.refId) as AxiosResponse<any, any>;
        setVoucherDetailData(response.data);
        setIsModalVisible(!isModalVisible);
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
                            </TableRow>
                        </TableHead>

                        <TableBody>
                            {Array.isArray(voucherList) && voucherList.map((row, index) => (
                                <React.Fragment key={index}>
                                    <TableRow onClick={() => handleRowClick(index, row)} style={{ cursor: 'pointer' }}>
                                        <TableCell>{row.firstName + ' ' + row.lastName}</TableCell>
                                        <TableCell>{formatDateToDDMMYYYY(row.voucherDate as string)}</TableCell>
                                        <TableCell>{row.voucherAmount}</TableCell>
                                        <TableCell>
                                            {row.approvalStatus?.toLowerCase() === 'pending' && <b className='pending'>{capitalizeFirstLetter(ApprovalStatus.Pending)}</b>}
                                            {row.approvalStatus?.toLowerCase() === 'approved' && <b className='approved'>{capitalizeFirstLetter(ApprovalStatus.Approved)}</b>}
                                            {row.approvalStatus?.toLowerCase() === 'rejected' && <b className='rejected'>{capitalizeFirstLetter(ApprovalStatus.Rejected)}</b>}
                                        </TableCell>
                                    </TableRow>
                                    {expandedRowIndex === index && (
                                        <TableRow>
                                            <TableCell colSpan={4}>
                                                <Typography variant="body1">Expanded content for row {index}</Typography>
                                            </TableCell>
                                        </TableRow>
                                    )}
                                </React.Fragment>
                            ))}
                            {voucherList.length < 1 && (
                                <TableRow>
                                    <TableCell colSpan={4}>
                                        <Typography variant="body1" align='center'>No Voucher</Typography>
                                    </TableCell>
                                </TableRow>
                            )}
                        </TableBody>
                    </Table>
                </TableContainer>

                <Modal open={toggleModal} onClose={toggleModalHandler} aria-labelledby="modal-modal-title" aria-describedby="modal-modal-description">

                    <Box sx={modalStyle}>

                        <IconButton onClick={toggleModalHandler} sx={{ position: 'absolute', right: 8, top: 8 }}>
                            <CloseIcon />
                        </IconButton>

                        <Typography id="modal-modal-title" variant="h6" component="h2" sx={{ mb: 3 }}>Voucher</Typography>

                        <form onSubmit={formik.handleSubmit} onReset={formik.handleReset}>

                            {/* {validationErrors.map((error, index) => (
                                <div key={index} style={{ color: 'red' }}>{error}</div>
                            ))} */}

                            {inputList.map((input, index) => (


                                <Box margin={1} key={index} display="flex" flexDirection="row" alignItems="center">

                                    <Box mb={2} flex={1} mr={2}>
                                        <TextField
                                            fullWidth
                                            id="description"
                                            name="description"
                                            label="Description"
                                            type="text"
                                            value={input.detail}
                                            onChange={(e) => handleChange(index, 'detail', e.target.value)}
                                        />
                                    </Box>

                                    <Box mb={2} flex={1} mr={2}>
                                        <TextField
                                            fullWidth
                                            id="date"
                                            name="date"
                                            label="Date"
                                            type="date"
                                            value={input.date || new Date()}
                                            onChange={(e) => handleChange(index, 'date', e.target.value)}
                                        />
                                    </Box>
                                    <Box mb={2} flex={1}>
                                        <TextField
                                            fullWidth
                                            id="amount"
                                            name="amount"
                                            label="Amount"
                                            type="number"
                                            value={input.amount}
                                            onChange={(e) => handleChange(index, 'amount', e.target.value)}
                                        />
                                    </Box>

                                </Box>
                            ))}

                            <Box display="flex" flexDirection="row" justifyContent="flex-end" alignItems="flex-end" mb={3}>
                                <Button variant="contained" onClick={handleAddInput} size='large' style={{ marginRight: '8px' }}>
                                    <AddIcon />
                                </Button>
                            </Box>

                            <hr />

                            <p className='total-amount'>
                                <b>Total Amount : </b> {totalAmount}
                            </p>

                            <Box margin={1}>
                                <Button color="primary" variant="contained" size='large' fullWidth type="submit">Submit</Button>
                            </Box>
                        </form>
                    </Box>

                </Modal>

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

            </Container>



            <Footer />



            {isModalVisible && <VoucherModelDetail rowData={voucherDetailData} onClick={() => setIsModalVisible(!isModalVisible)} isVisible={isModalVisible} />}


        </>
    )
};

export default Index;