package com.example.project_iot_auto_watering.ui.signup

import android.os.Bundle
import android.util.Log
import android.view.LayoutInflater
import android.view.View
import android.view.ViewGroup
import android.widget.Toast
import androidx.fragment.app.Fragment
import androidx.lifecycle.ViewModelProvider
import androidx.navigation.fragment.findNavController
import com.example.project_iot_auto_watering.R
import com.example.project_iot_auto_watering.data.repository.AuthRepository
import com.example.project_iot_auto_watering.data.retrofit.RetrofitInstance
import com.example.project_iot_auto_watering.databinding.FragmentSignupBinding
import com.example.project_iot_auto_watering.ui.login.viewmodel.AuthViewModel
import com.example.project_iot_auto_watering.ui.login.viewmodel.AuthViewModelFactory
import com.example.project_iot_auto_watering.util.checkAccountRegister

class FragmentSignUp : Fragment(), View.OnClickListener {
    private var _binding: FragmentSignupBinding? = null
    private val binding get() = _binding!!
    private lateinit var viewModelAuth: AuthViewModel
    private val authRepository = AuthRepository(RetrofitInstance.api)

    override fun onCreateView(
        inflater: LayoutInflater,
        container: ViewGroup?,
        savedInstanceState: Bundle?
    ): View? {
        _binding = FragmentSignupBinding.inflate(inflater, container, false)
        return binding.root
    }

    override fun onViewCreated(view: View, savedInstanceState: Bundle?) {
        super.onViewCreated(view, savedInstanceState)

        viewModelAuth = ViewModelProvider(requireActivity(), AuthViewModelFactory(authRepository))[AuthViewModel::class.java]

        initListener()
    }

    private fun initListener() {
        binding.backtologin.setOnClickListener(this)
        binding.SignUp.setOnClickListener(this)
    }

    override fun onClick(p0: View?) {
        when (p0?.id) {
            R.id.backtologin -> {
                findNavController().popBackStack()
            }

            R.id.SignUp -> {
                val username = binding.name.text.toString()
                val email = binding.eMail.text.toString()
                val password = binding.passWord.text.toString()
                val cfPassword = binding.confirmpass.text.toString()
                when (checkAccountRegister(username, email, password, cfPassword)) {
                    -1 -> {
                        Toast.makeText(requireContext(),"Vui lòng nhập đầy đủ thông tin!", Toast.LENGTH_SHORT).show()
                        binding.eMail.requestFocus()
                    }

                    0 -> {
                        Toast.makeText(requireContext(),"Mật khẩu xác nhận không khớp!", Toast.LENGTH_SHORT).show()
                        binding.passWord.requestFocus()
                    }

                    -2 -> {
                        Toast.makeText(requireContext(),"Mật khẩu tối thiểu 6 ký tự, 1 chữ số", Toast.LENGTH_SHORT).show()
                    }

                    1 -> {
                        viewModelAuth.register(username,email,password) {message->
                            if(message=="success"){
                                Toast.makeText(requireContext(), message, Toast.LENGTH_SHORT).show()
                                viewModelAuth.getAccountFromRegister(email,password)
                                Log.d("datasignup","${viewModelAuth.emailLogin},${viewModelAuth.passwordLogin}")
                                findNavController().popBackStack()
                            }
                            else{
                                Toast.makeText(requireContext(), message, Toast.LENGTH_SHORT).show()
                            }
                        }
                    }
                }
            }
        }

    }

}