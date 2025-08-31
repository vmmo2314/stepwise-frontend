import React, { useState } from 'react'
import { connect, useDispatch } from 'react-redux';
import { Eye, EyeOff } from "lucide-react";
import { Link, useNavigate } from 'react-router-dom'
import { loadingToggleAction,loginAction,
} from '../../store/actions/AuthActions';

//
import logo from '../../assets/images/logo.png'
import logotext from '../../assets/images/logo-text.png'

function Login (props) {
    const [email, setEmail] = useState('@gmail.com');
    let errorsObj = { email: '', password: '' };
    const [errors, setErrors] = useState(errorsObj);
    const [password, setPassword] = useState('123456789');
    const dispatch = useDispatch();
	const navigate = useNavigate();
	const [showPassword, setShowPassword] = useState(false);

    function onLogin(e) {
        e.preventDefault();
        let error = false;
        const errorObj = { ...errorsObj };
        if (email === '') {
            errorObj.email = 'Ingresa tu correo electrónico';
            error = true;
        }
        if (password === '') {
            errorObj.password = 'Ingresa tu contraseña';
            error = true;
        }
        setErrors(errorObj);
        if (error) {
			return ;
		}
		dispatch(loadingToggleAction(true));	
        dispatch(loginAction(email, password, navigate));
    }
	

  return (
		<div className="login-form-bx">
			<div className="container-fluid">
				<div className="row">
					<div className="col-lg-6 col-md-7 box-skew d-flex">
						<div className="authincation-content">
							<Link to="#" className="login-logo">
								<img src={logo} alt="" className="logo-icon me-2"/>
							</Link>
							<div className="mb-4">
								<h1 className="mb-1 font-w600">¡Hola!</h1>
								<p className="">Inicia sesión con tus credenciales</p>
							</div>
							{props.errorMessage && (
								<div className='bg-red-300 text-red-900 border border-red-900 p-1 my-2'>
									{props.errorMessage}
								</div>
							)}
							{props.successMessage && (
								<div className='bg-green-300 text-green-900 border border-green-900 p-1 my-2'>
									{props.successMessage}
								</div>
							)}
							<form onSubmit={onLogin}>
								<div className="form-group">
									<label className="mb-2 ">
										<strong className="">Correo electrónico</strong><span className='required'>*</span>
									</label>
									<input type="email" className="form-control" value={email} onChange={(e) => setEmail(e.target.value)}/>
									{errors.email && <div className="text-danger fs-12">{errors.email}</div>}
								</div>
								<div className="form-group">
								<label className="mb-2">
									<strong>Contraseña</strong><span className="required">*</span>
								</label>
								<div className="position-relative">
									<input
									type={showPassword ? "text" : "password"}
									className="form-control pr-10"
									value={password}
									onChange={(e) => setPassword(e.target.value)}
									/>
									<button
									type="button"
									className="position-absolute top-50 end-0 translate-middle-y me-3 border-0 bg-transparent"
									onClick={() => setShowPassword(!showPassword)}
									>
									{showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
									</button>
								</div>
								{errors.password && <div className="text-danger fs-12">{errors.password}</div>}
								</div>
								<div className="form-row d-flex justify-content-between mt-4 mb-2">
									<div className="form-group">
										<div className="custom-control custom-checkbox ms-1 ">
											<input type="checkbox" className="form-check-input" id="basic_checkbox_1"/>
											<label className="form-check-label" style={{ marginTop: '4px' }} htmlFor="basic_checkbox_1">Recordar mis datos</label>										</div>
									</div>
								</div>
								<div className="text-center">
									<button type="submit" className="btn btn-primary btn-block">Iniciar sesión</button>
								</div>
							</form>
							<div className="new-account mt-2">
								<p className="mb-0">Aún no tienes cuenta?{" "}
									<Link className="text-primary" to="/page-register">Regístrate</Link>
								</p>
							</div>
						</div>
					</div>
					<div className="col-lg-6 col-md-5 d-flex box-skew1">						
					</div>
				</div>
			</div>
		</div>
		
    )
}

const mapStateToProps = (state) => {
    return {
        errorMessage: state.auth.errorMessage,
        successMessage: state.auth.successMessage,
        showLoading: state.auth.showLoading,
    };
};
export default connect(mapStateToProps)(Login);