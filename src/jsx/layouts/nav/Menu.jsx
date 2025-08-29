export const MenuList = [
  {
    title: 'Panel de control',
    to: 'dashboard',
    roles: ['doctor'],
    iconStyle: <i className="flaticon-381-home-2"></i>,
  },
  {
    title: 'Panel Paciente',
    to: 'Panel-Paciente',
    roles: ['paciente'],
    iconStyle: <i className="flaticon-381-home-2"></i>,
  },
  {
    title: 'Diagnosticar',
    to: 'diagnosticar-paciente',
    roles: ['doctor'],
    iconStyle: <i className="flaticon-381-networking"></i>,
  },
  {
    title: 'Lista de pacientes',
    to: 'Mis-Pacientes',
    roles: ['doctor'],
    iconStyle: <i className="flaticon-381-user-7"></i>,
  },
  {
    title: 'Expediente',
    to: 'expediente',
    roles: ['paciente'],
    iconStyle: <i className="flaticon-381-notepad"></i>,
  },

  {
    title: 'Consejos',
    to: 'Plan',
    roles: ['paciente'],
    iconStyle: <i className="flaticon-381-layer-1"></i>,
  },
  {
    title: 'Mis citas',
    to: 'app-calender',
    roles: ['paciente'],
    iconStyle: <i className="flaticon-381-calendar-1"></i>,
  },
    {
    title: 'Citas',
    to: 'Citas',
    roles: ['doctor'],
    iconStyle: <i className="flaticon-381-calendar-1"></i>,
  },
  {
    title: 'Ajustes',
    to: 'Plan',
    roles: ['doctor', 'paciente'],
    iconStyle: <i className="flaticon-381-settings-2"></i>,
  },
  {
    title: 'Ayuda',
    to: 'Plan',
    roles: ['paciente'],
    iconStyle: <i className="flaticon-381-help-1"></i>,
  },
    /*
    {
        title: 'Utilidades',	
        classsChange: 'mm-collapse',		
        iconStyle: <i className="flaticon-381-networking"></i>,
        content: [           
            {
                title: 'Lista de pacientes',
                to: 'patient-list',
            },
            {
                title: 'Expediente',
                to: 'expediente',
            },
            {
                title: 'Doctor',
                to: 'doctor-list',
            },
            {
                title: 'Doctor Detail',
                to: 'doctor-details',                
            },
            {
                title: 'Review',
                to: 'DiagnosticWindow',
            },            		
            {
                title: 'Task',
                to: 'task',                
            },
        ],
    },

    {   
        title:'Staff',
        iconStyle: <i className="flaticon-381-id-card-4"></i>,        
        content : [
            {
                title:'Staff',
                to:'staff'
            },
            {
                title:'Staff Profile',
                to:'staff-profile'
            },
        ],
    },

    {
        title: 'Apps',	
        classsChange: 'mm-collapse',
        iconStyle: <i className="flaticon-381-television"></i>,
        content: [
            {
                title: 'Profile',
                to: 'app-profile'
            },           
            {
                title: 'Post Details',
                to: 'post-details'
            },
            {
                title: 'Email',
                hasMenu : true,
                content: [
                    {
                        title: 'Compose',
                        to: 'email-compose',
                    },
                    {
                        title: 'Inbox',
                        to: 'email-inbox',
                    },
                    {
                        title: 'Read',
                        to: 'email-read',
                    }
                ],
            },
            {
                title:'Calendar',
                to: 'app-calender'
            },
            {
                title: 'Shop',
                hasMenu : true,
                content: [
                    {
                        title: 'Product Grid',
                        to: 'ecom-product-grid',
                    },
                    {
                        title: 'Product List',
                        to: 'ecom-product-list',
                    },
                    {
                        title: 'Product Details',
                        to: 'ecom-product-detail',
                    },
                    {
                        title: 'Order',
                        to: 'ecom-product-order',
                    },
                    {
                        title: 'Checkout',
                        to: 'ecom-checkout',
                    },
                    {
                        title: 'Invoice',
                        to: 'ecom-invoice',
                    },
                    {
                        title: 'Customers',
                        to: 'ecom-customers',
                    },
                ],
            },
        ],
    },

    {
        title: 'Charts',	
        classsChange: 'mm-collapse',
        iconStyle: <i className="flaticon-381-controls-3"></i>,
        content: [
            {
                title: 'RechartJs',
                to: 'chart-rechart',					
            },
            {
                title: 'Chartjs',
                to: 'chart-chartjs',					
            },
            {
                title: 'Sparkline',
                to: 'chart-sparkline',					
            },
            {
                title: 'Apexchart',
                to: 'chart-apexchart',					
            },
        ]
    },

    {
        title: 'Bootstrap',	
        classsChange: 'mm-collapse',
        iconStyle: <i className="flaticon-381-internet"></i>,	
        content: [
            {
                title: 'Accordion',
                to: 'ui-accordion',					
            },
            {
                title: 'Alert',
                to: 'ui-alert',					
            },
            {
                title: 'Badge',
                to: 'ui-badge',					
            },
            {
                title: 'Button',
                to: 'ui-button',					
            },
            {
                title: 'Modal',
                to: 'ui-modal',					
            },
            {
                title: 'Button Group',
                to: 'ui-button-group',					
            },
            {
                title: 'List Group',
                to: 'ui-list-group',					
            },
            {
                title: 'Cards',
                to: 'ui-card',					
            },
            {
                title: 'Carousel',
                to: 'ui-carousel',					
            },
            {
                title: 'Dropdown',
                to: 'ui-dropdown',					
            },
            {
                title: 'Popover',
                to: 'ui-popover',					
            },
            {
                title: 'Progressbar',
                to: 'ui-progressbar',					
            },
            {
                title: 'Tab',
                to: 'ui-tab',					
            },
            {
                title: 'Typography',
                to: 'ui-typography',					
            },
            {
                title: 'Pagination',
                to: 'ui-pagination',					
            },
            {
                title: 'Grid',
                to: 'ui-grid',					
            },
        ]
    },

    {
        title:'Plugins',
        classsChange: 'mm-collapse',
        iconStyle : <i className="flaticon-381-heart"></i>,
        content : [
            {
                title:'Select 2',
                to: 'uc-select2',
            },           
            {
                title:'Sweet Alert',
                to: 'uc-sweetalert',
            },
            {
                title:'Toastr',
                to: 'uc-toastr',
            },          
            {
                title:'Light Gallery',
                to: 'uc-lightgallery',
            },
        ]
    },

    {   
        title:'Widget',
        iconStyle: <i className="flaticon-381-settings-2"></i>,
        to: 'widget-basic',
    },

    {
        title:'Forms',
        classsChange: 'mm-collapse',
        iconStyle: <i className="flaticon-381-notepad"></i>,
        content : [
            {
                title:'Form Elements',
                to: 'form-element',
            },
            {
                title:'Wizard',
                to: 'form-wizard',
            },
            {
                title:'CkEditor',
                to: 'form-ckeditor',
            },
            {
                title:'Pickers',
                to: 'form-pickers',
            },
            {
                title:'Form Validate',
                to: 'form-validation',
            },
        ]
    },

    {
        title:'Table',
        classsChange: 'mm-collapse',
        iconStyle: <i className="flaticon-381-network"></i>,
        content : [
            {
                title:'Table Filtering',
                to: 'table-filtering',
            },
            {
                title:'Table Sorting',
                to: 'table-sorting',
            },
            {
                title:'Bootstrap',
                to: 'table-bootstrap-basic',
            },
        ]
    },

    {
        title:'Pages',
        classsChange: 'mm-collapse',
        iconStyle: <i className="flaticon-381-layer-1"></i>,
        content : [
            {
                title:'Error',
                hasMenu : true,
                content : [
                    {
                        title: 'Error 400',
                        to : 'page-error-400',
                    },
                    {
                        title: 'Error 403',
                        to : 'page-error-403',
                    },
                    {
                        title: 'Error 404',
                        to : 'page-error-404',
                    },
                    {
                        title: 'Error 500',
                        to : 'page-error-500',
                    },
                    {
                        title: 'Error 503',
                        to : 'page-error-503',
                    },
                ],
            },
            {
                title:'Lock Screen',
                to: 'page-lock-screen',
            },
        ]
    },
    */
];
    