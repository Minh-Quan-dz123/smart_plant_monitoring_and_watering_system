package com.example.project_iot_auto_watering.ui.login

import android.content.Context
import android.content.SharedPreferences
import android.os.Bundle
import android.util.Log
import android.view.LayoutInflater
import android.view.View
import android.view.ViewGroup
import android.widget.Toast
import androidx.core.content.edit
import androidx.fragment.app.Fragment
import androidx.lifecycle.ViewModelProvider
import androidx.navigation.fragment.findNavController
import com.example.project_iot_auto_watering.R
import com.example.project_iot_auto_watering.data.repository.AuthRepository
import com.example.project_iot_auto_watering.data.retrofit.RetrofitInstance
import com.example.project_iot_auto_watering.databinding.FragmentLoginBinding
import com.example.project_iot_auto_watering.ui.login.viewmodel.AuthViewModel
import com.example.project_iot_auto_watering.ui.login.viewmodel.AuthViewModelFactory
import com.example.project_iot_auto_watering.util.NavOption
import com.example.project_iot_auto_watering.util.checkAccount
import com.example.project_iot_auto_watering.util.setStateOpenedApp

class FragmentLogin : Fragment(), View.OnClickListener {
    private var _binding: FragmentLoginBinding? = null
    private val binding get() = _binding!!
    private lateinit var viewModelAuth: AuthViewModel
    private val authRepository = AuthRepository(RetrofitInstance.api)
    private lateinit var pref: SharedPreferences

    override fun onCreateView(
        inflater: LayoutInflater,
        container: ViewGroup?,
        savedInstanceState: Bundle?
    ): View? {
        _binding = FragmentLoginBinding.inflate(inflater, container, false)
        return binding.root
    }

    override fun onViewCreated(view: View, savedInstanceState: Bundle?) {
        super.onViewCreated(view, savedInstanceState)

        //opened app
        setStateOpenedApp(requireContext(), true)

        //lấy token từ file SharedPreferences
        pref = requireContext().getSharedPreferences("Auth", Context.MODE_PRIVATE)

        viewModelAuth =
            ViewModelProvider(
                requireActivity(),
                AuthViewModelFactory(authRepository)
            )[AuthViewModel::class.java]

        initObserve()
        //get data

        Log.d("datalogin", "${viewModelAuth.emailLogin},${viewModelAuth.passwordLogin}")
        initListener()
    }

    private fun initListener() {
        binding.login.setOnClickListener(this)
        binding.forgotPassword.setOnClickListener(this)
        binding.signUp.setOnClickListener(this)
        binding.googleicon.setOnClickListener(this)
    }

    override fun onClick(p0: View?) {
        when (p0?.id) {
            R.id.login -> {
                val email = binding.eMail.text.toString()
                val password = binding.passWord.text.toString()
                if (checkAccount(email, password)) {
                    viewModelAuth.login(email, password) { state ->
                        if (state) {
                            Toast.makeText(
                                requireContext(),
                                "Đăng nhập thành công!",
                                Toast.LENGTH_SHORT
                            ).show()
                            pref.edit { putString("token", viewModelAuth.tokenAuth) }
                            findNavController().navigate(R.id.action_fragmentLogin_to_fragmentHome)
                        } else {
                            Toast.makeText(
                                requireContext(),
                                "Thông tin đăng nhập sai hoặc chưa tồn tại!",
                                Toast.LENGTH_SHORT
                            ).show()
                        }
                    }
                } else {
                    Toast.makeText(
                        requireContext(),
                        "Vui lòng nhập đầy đủ thông tin!",
                        Toast.LENGTH_SHORT
                    ).show()
                    binding.eMail.requestFocus()
                }

            }

            R.id.forgotPassword -> {
            }

            R.id.signUp -> {
                findNavController().navigate(
                    R.id.action_fragmentLogin_to_fragmentSignUp,
                    null,
                    NavOption.animationFragment
                )
            }

            R.id.googleicon -> {

            }
        }
    }

    private fun initObserve(){
        viewModelAuth.emailLogin.observe(viewLifecycleOwner) { email ->
            binding.eMail.setText(email)
        }
        viewModelAuth.passwordLogin.observe(viewLifecycleOwner) { password ->
            binding.passWord.setText(password)
        }
    }
}